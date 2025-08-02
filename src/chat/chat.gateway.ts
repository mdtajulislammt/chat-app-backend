import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, { userId: number; socketId: string }>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const username = payload.username;

      this.connectedUsers.set(username, { userId, socketId: client.id });
      client.join(`user_${userId}`);

      // Notify others that user is online
      client.broadcast.emit('userOnline', { userId, username });

      console.log(`User ${username} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Find and remove user from connected users
    for (const [username, userData] of this.connectedUsers.entries()) {
      if (userData.socketId === client.id) {
        this.connectedUsers.delete(username);
        client.broadcast.emit('userOffline', { userId: userData.userId, username });
        console.log(`User ${username} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      const senderId = payload.sub;

      // Save message to database
      const message = await this.chatService.sendMessage(senderId, sendMessageDto);

      // Emit to receiver if specified
      if (sendMessageDto.receiverId) {
        this.server.to(`user_${sendMessageDto.receiverId}`).emit('newMessage', message);
      }

      // Emit to room if specified
      if (sendMessageDto.roomId) {
        this.server.to(sendMessageDto.roomId).emit('newMessage', message);
      }

      return message;
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    client.emit('joinedRoom', roomId);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(roomId);
    client.emit('leftRoom', roomId);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { receiverId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`user_${data.receiverId}`).emit('userTyping', {
      userId: data.receiverId,
      isTyping: data.isTyping,
    });
  }
} 