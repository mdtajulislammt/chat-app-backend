import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { Inject } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { MessageStatus } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';

dotenv.config();

interface JwtPayload {
  sub: number;
  username: string;
  email: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer() server: Server;

  private connectedUsers = new Map<string, number>();
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'chatappmt';

  constructor(
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
  ) {}

  /** Helper: Map socket to user */
  getUserIdBySocket(socketId: string): number | undefined {
    return this.connectedUsers.get(socketId);
  }

  /** 🔹 Notify a user with a custom event */
  notifyUser(userId: number, data: any) {
    this.server.sockets.sockets.forEach((socket) => {
      const uid = this.getUserIdBySocket(socket.id);
      if (uid === userId) {
        socket.emit('notification', data);
      }
    });
  }

  // 1️⃣ CONNECT / DISCONNECT
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  // 2️⃣ AUTHENTICATE SOCKET
  @SubscribeMessage('auth')
  handleAuth(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const token = data?.token;
    if (!token) {
      return client.emit('auth_failed', { message: 'Token missing' });
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as string | JwtPayload;

      if (typeof decoded === 'string' || !decoded.sub) {
        client.emit('auth_failed', { message: 'Invalid token payload' });
        return client.disconnect();
      }

      this.connectedUsers.set(client.id, decoded.sub);

      console.log(
        `✅ Authenticated ${decoded.username ?? 'User'} on socket ${client.id}`,
      );
      client.emit('auth_success', { userId: decoded.sub });
    } catch (err: any) {
      console.error(`❌ JWT Error: ${err.message}`);
      client.emit('auth_failed', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }
  // 3️⃣ SEND MESSAGE EVENT
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) {
      return client.emit('error', { message: 'Not authenticated' });
    }

    const { receiverId, content } = data;

    // 1️⃣ Save message to DB as SENT
    const savedMessage = await this.messageService.saveMessage(
      senderId,
      receiverId,
      content,
    );

    let delivered = false;
    this.server.sockets.sockets.forEach((socket) => {
      const userId = this.connectedUsers.get(socket.id);
      if (userId === receiverId) {
        delivered = true;
      
        socket.emit('receive_message', { ...savedMessage, status: 'DELIVERED' });
        socket.emit('notification', {
          title: 'New Message',
          from: senderId,
          content: savedMessage.content,
        });
      
        // ✅ Save notification to DB (awaited)
         this.notificationService.createNotification(
          receiverId,
          'New Message',
          savedMessage.content,
        );
      
         this.messageService.updateMessageStatus(
          savedMessage.id,
          MessageStatus.DELIVERED,
        );
      }
      
    });

    // ✅ NEW: If receiver is offline, still save notification
    if (!delivered) {
      await this.notificationService.createNotification(
        receiverId,
        'New Message',
        savedMessage.content,
      );
    }

    // 3️⃣ Emit back to Sender (Existing)
    client.emit('message_status', {
      ...savedMessage,
      status: delivered ? 'DELIVERED' : 'SENT',
    });
  }

  // 4️⃣ READ RECEIPT EVENT
  @SubscribeMessage('read_message')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { messageId, senderId } = data;

    // Update DB to READ
    const updated = await this.messageService.updateMessageStatus(
      messageId,
      MessageStatus.READ,
    );

    if (!updated) return;

    // Notify original sender in real-time
    this.server.sockets.sockets.forEach((socket) => {
      const userId = this.connectedUsers.get(socket.id);
      if (userId === senderId) {
        socket.emit('message_status', { id: messageId, status: 'READ' });
        socket.emit('notification', {
          title: 'Message Read',
          messageId,
          status: 'READ',
        });
      }
    });
  }
}
