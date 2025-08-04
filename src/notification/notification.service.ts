import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}


  // Create notification
  async createNotification(userId: number, title: string, content: string) {
    return this.prisma.notification.create({
      data: { userId, title, content },
    });
  }

  // Get all notifications for a user
  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // notification.service.ts
async getAllNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }  

  // notification.service.ts
async getNotificationsByUserId(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  

  // Mark notification as read
  async markAsRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}


