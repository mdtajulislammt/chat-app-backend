import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageStatusDto, MessageStatus } from './dto/message-status.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: number, sendMessageDto: SendMessageDto) {
    const { content, receiverId, roomId } = sendMessageDto;

    // Create message
    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        roomId,
        status: MessageStatus.SENT,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return message;
  }

  async getChatHistory(userId: number, otherUserId: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateMessageStatus(messageStatusDto: MessageStatusDto) {
    return this.prisma.message.update({
      where: { id: parseInt(messageStatusDto.messageId) },
      data: { status: messageStatusDto.status },
    });
  }

  async getUnreadMessages(userId: number) {
    return this.prisma.message.findMany({
      where: {
        receiverId: userId,
        status: {
          not: MessageStatus.READ,
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async markMessagesAsRead(userId: number, senderId: number) {
    return this.prisma.message.updateMany({
      where: {
        receiverId: userId,
        senderId: senderId,
        status: {
          not: MessageStatus.READ,
        },
      },
      data: {
        status: MessageStatus.READ,
      },
    });
  }
} 