import { Controller, Get, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MessageService } from 'src/message/message.service';
import { ChatGateway } from 'src/chat/chat.gateway';

interface RequestWithUser extends Request {
  user?: { userId: number; username?: string };
}

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // 1️⃣ Get all notifications for logged-in user
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyNotifications(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const notifications = await this.notificationService.getUserNotifications(
      userId!,
    );
    return { success: true, notifications };
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllNotifications() {
    const notifications = await this.notificationService.getAllNotifications();
    return { success: true, notifications };
  }


@UseGuards(JwtAuthGuard)
@Get('user/:id')
async getNotificationsByUser(@Param('id') id: string) {
  const userId = parseInt(id, 10);
  const notifications = await this.notificationService.getNotificationsByUserId(userId);
  return { success: true, notifications };
}



  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const notificationId = parseInt(id);
    const updated = await this.notificationService.markAsRead(notificationId);
    return { success: true, notification: updated };
  }
}


