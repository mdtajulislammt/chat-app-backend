import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatGateway } from 'src/chat/chat.gateway';
import { MessageStatus } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';

interface RequestWithUser extends Request {
  user?: { userId: number; username?: string };
}

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 1️⃣ GET /messages/history
   * Fetch all messages for logged-in user (sent + received)
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getMyMessages(@Req() req: RequestWithUser) {
    const loggedInUser = req.user?.userId;
    const allMessages = await this.messageService.getChatHistoryByUser(
      loggedInUser!,
    );

    return {
      success: true,
      messages: allMessages ?? [],
    };
  }

  /**
   * 2️⃣ POST /messages/send
   * Send a new message & emit real-time event + notification
   */
  @UseGuards(JwtAuthGuard)
  @Post('send')
  async sendMessage(
    @Req() req: RequestWithUser,
    @Body('receiverId') receiverId: number,
    @Body('content') content: string,
  ) {
    const senderId = req.user?.userId;

    if (!senderId || !receiverId || !content) {
      return { success: false, message: 'Invalid data' };
    }

    // 1️⃣ Save message to DB as SENT
    const message = await this.messageService.saveMessage(
      senderId,
      receiverId,
      content,
    );

    // 2️⃣ Emit to receiver via Socket.IO if online
    let delivered = false;
    this.chatGateway.server.sockets.sockets.forEach((socket) => {
      const userId = this.chatGateway.getUserIdBySocket(socket.id);
      if (userId === receiverId) {
        delivered = true;

        // Real-time message event
        socket.emit('receive_message', {
          ...message,
          status: 'DELIVERED',
        });

        // Real-time notification event
        socket.emit('notification', {
            type: 'NEW_MESSAGE',
            title: 'New Message',
            content: message.content,
            senderId: senderId,
            messageId: message.id,
          });

        // Update DB status to DELIVERED
        this.messageService.updateMessageStatus(
          message.id,
          MessageStatus.DELIVERED,
        );
      }
    });

    if (!delivered) {
        await this.notificationService.createNotification(
          receiverId,
          'New Message',
          message.content,
        );
      }

    // 3️⃣ Emit back to sender (confirmation)
    this.chatGateway.server.sockets.sockets.forEach((socket) => {
      const userId = this.chatGateway.getUserIdBySocket(socket.id);
      if (userId === senderId) {
        socket.emit('message_status', {
          ...message,
          status: delivered ? 'DELIVERED' : 'SENT',
        });
      }
    });

    // 4️⃣ Return API response
    return {
      success: true,
      message: {
        ...message,
        status: delivered ? 'DELIVERED' : 'SENT',
      },
    };
  }
}
