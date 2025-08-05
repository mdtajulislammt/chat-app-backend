/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PresenceService {
  constructor(private prisma: PrismaService) {}

  async setUserOnline(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'online' },
    });
  }

  async setUserOffline(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'offline',
        lastSeen: new Date(), // track last seen
      },
    });
  }

  async getLastSeen(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.lastSeen ?? null;
  }

  async getOnlineUsers() {
    return this.prisma.user.findMany({
      where: { status: 'online' },
      select: { id: true, username: true },
    });
  }

  async updateLastSeen(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'offline', updatedAt: new Date() },
    });
  }

  async updateStatus(userId: number, status: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}
