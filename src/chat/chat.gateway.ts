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
  
  dotenv.config();
  
  interface JwtPayload {
    sub: number;
    username: string;
    email: string;
  }
  
  interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    createdAt: string;
  }
  
  @WebSocketGateway({ cors: { origin: '*' } })
  export class ChatGateway {
    @WebSocketServer() server: Server;
  
    private connectedUsers = new Map<string, number>();
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'chatappmt';
  
    // 1️⃣ CONNECT / DISCONNECT EVENTS
    handleConnection(client: Socket) {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);
  
      if (token) {
        this.verifyToken(client, token);
      } else {
        console.log(`Client ${client.id} connected without token → waiting for auth event`);
      }
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
      this.connectedUsers.delete(client.id);
    }
  
    // 2️⃣ AUTH EVENT FOR POSTMAN / LATE AUTH
    @SubscribeMessage('auth')
    handleAuth(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
      const token = data?.token;
      if (!token) return client.emit('auth_failed', { message: 'Token missing' });
      this.verifyToken(client, token);
    }
  
    private verifyToken(client: Socket, token: string) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'YOUR_SECRET_KEY') as unknown as JwtPayload;
        this.connectedUsers.set(client.id, decoded.sub);
        console.log(`✅ User ${decoded.username} authenticated on socket ${client.id}`);
        client.emit('auth_success', { userId: decoded.sub });
      } catch (err) {
        console.log(`❌ JWT error: ${err.message}`);
        client.emit('auth_failed', { message: 'Invalid token' });
        client.disconnect();
      }
    }
  
    // 3️⃣ SEND MESSAGE EVENT
    @SubscribeMessage('send_message')
    handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) {
        return client.emit('error', { message: 'Not authenticated' });
      }
  
      const { receiverId, content } = data;
  
      // Create message
      const message: ChatMessage = {
        id: Date.now(),
        senderId,
        receiverId,
        content,
        status: 'SENT',
        createdAt: new Date().toISOString(),
      };
  
      // 4️⃣ Emit to Receiver (DELIVERED)
      let delivered = false;
      this.server.sockets.sockets.forEach((socket) => {
        const userId = this.connectedUsers.get(socket.id);
        if (userId === receiverId) {
          message.status = 'DELIVERED';
          socket.emit('receive_message', message);
          delivered = true;
        }
      });
  
      // 5️⃣ Emit back to Sender (SENT or DELIVERED)
      client.emit('message_status', {
        ...message,
        status: delivered ? 'DELIVERED' : 'SENT',
      });
    }
  
    // 6️⃣ OPTIONAL: READ RECEIPT
    @SubscribeMessage('read_message')
    handleReadMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
      const { messageId, senderId } = data;
  
      // Notify the original sender that message is read
      this.server.sockets.sockets.forEach((socket) => {
        const userId = this.connectedUsers.get(socket.id);
        if (userId === senderId) {
          socket.emit('message_status', {
            id: messageId,
            status: 'READ',
          });
        }
      });
    }
  }
  