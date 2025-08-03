import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageStatus, MessageType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: number, receiverId: number, content: string, type: MessageType = 'TEXT') {
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        type,
        status: MessageStatus.SENT,
      },
    });
  }

  async getMessagesBetweenUsers(userA: number, userB: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
