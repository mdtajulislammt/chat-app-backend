import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from './presence.service';

@WebSocketGateway({ cors: true })
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, number>(); // socketId → userId

  constructor(private presenceService: PresenceService) {}

  async handleConnection(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (!userId) return client.disconnect();

    this.connectedUsers.set(client.id, userId);
    await this.presenceService.setUserOnline(userId);

    // Broadcast presence to all users
    this.server.emit('user_online', { userId });
  }

  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    this.connectedUsers.delete(client.id);
    await this.presenceService.setUserOffline(userId);

    // Broadcast presence to all users
    this.server.emit('user_offline', { userId });
  }
  // ✅ Typing started
  @SubscribeMessage('start_typing')
  startTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: number },
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    // Find the socket of the receiver
    const receiverSocket = [...this.server.sockets.sockets.values()].find(
      (socket) => this.connectedUsers.get(socket.id) === data.receiverId,
    );

    if (receiverSocket) {
      receiverSocket.emit('typing', { from: senderId });
    }
  }

  // ✅ Typing stopped
  @SubscribeMessage('stop_typing')
  stopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: number },
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    // Find the socket of the receiver
    const receiverSocket = [...this.server.sockets.sockets.values()].find(
      (socket) => this.connectedUsers.get(socket.id) === data.receiverId,
    );

    if (receiverSocket) {
      receiverSocket.emit('stop_typing', { from: senderId });
    }
  }
}
