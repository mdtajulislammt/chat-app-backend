/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
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
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private connectedUsers = new Map<string, number>();
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'chatappmt';

  // Retry Queue for undelivered messages
  private retryQueue: { receiverId: number; message: any }[] = [];

  constructor(
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
  ) {}

  /** Helper: Map socket to user */
  getUserIdBySocket(socketId: string): number | undefined {
    return this.connectedUsers.get(socketId);
  }

  /** Notify a user with a custom event */
  notifyUser(userId: number, data: any) {
    this.server.sockets.sockets.forEach((socket) => {
      const uid = this.getUserIdBySocket(socket.id);
      if (uid === userId) {
        socket.emit('notification', data);
      }
    });
  }

  //  CONNECT / DISCONNECT
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(` Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  //  Retry delivery when a user reconnects
  afterInit() {
    console.log(' WebSocket Gateway Initialized');
  }

  @SubscribeMessage('retry_pending')
  handleRetry(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    const pendingMessages = this.retryQueue.filter((m) => m.receiverId === userId);
    if (pendingMessages.length > 0) {
      pendingMessages.forEach((msg) => {
        client.emit('receive_message', msg.message);
      });

      // Remove from queue after delivery
      this.retryQueue = this.retryQueue.filter((m) => m.receiverId !== userId);
    }
  }

  // 2 AUTHENTICATE SOCKET
  @SubscribeMessage('auth')
  handleAuth(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const token = data?.token as string;
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
        ` Authenticated ${decoded.username ?? 'User'} on socket ${client.id}`,
      );
      client.emit('auth_success', { userId: decoded.sub });

      // 🔹 ADDED: Deliver any pending messages after auth
      this.handleRetry(client);

    } catch (err: unknown) {
      console.error(
        `❌ JWT Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      client.emit('auth_failed', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  //  SEND MESSAGE EVENT
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) {
      return client.emit('error', { message: 'Not authenticated' });
    }

    const { receiverId, content } = data as {
      receiverId: number;
      content: string;
    };

    //  Save message to DB as SENT
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

        socket.emit('receive_message', {
          ...savedMessage,
          status: 'DELIVERED',
        });
        socket.emit('notification', {
          title: 'New Message',
          from: senderId,
          content: savedMessage.content,
        });

        //  Save notification to DB (awaited)
        void this.notificationService.createNotification(
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

    // NEW: If receiver is offline, still save notification
    if (!delivered) {
      await this.notificationService.createNotification(
        receiverId,
        'New Message',
        savedMessage.content,
      );

      // Add message to retry queue
      this.retryQueue.push({ receiverId, message: savedMessage });
      console.log(` Queued message for ${receiverId}`);
    }

    //  Emit back to Sender (Existing)
    client.emit('message_status', {
      ...savedMessage,
      status: delivered ? 'DELIVERED' : 'SENT',
    });
  }

  //  READ RECEIPT EVENT
  @SubscribeMessage('read_message')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { messageId, senderId } = data as {
      messageId: number;
      senderId: number;
    };

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
