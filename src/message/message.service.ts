import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageStatus } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1️⃣ Save a new message
   */
  async saveMessage(senderId: number, receiverId: number, content: string) {
    console.log(`💾 Saving message from ${senderId} to ${receiverId}: "${content}"`);

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });
  }

  /**
   * 2️⃣ Fetch chat history between two users
   */
  async getChatHistoryByUser(userId: number) {
    // console.log(`📥 Fetching all messages for user ${userId}`);
  
    const userWithMessages = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        receivedMessages: true,
        sentMessages: true,
      },
    });
  
    if (!userWithMessages) return null;
  
    // Combine and sort messages by createdAt
    const allMessages = [
      ...userWithMessages.sentMessages,
      ...userWithMessages.receivedMessages,
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
    return allMessages;
  }
  

  /**
   * 3️⃣ Update message status
   */
  async updateMessageStatus(messageId: number, status: MessageStatus) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
  
    if (!message) {
      return null;
    }
  
    return this.prisma.message.update({
      where: { id: messageId },
      data: { status },
    });
  }

  async getMessageById(messageId: number) {
    return this.prisma.message.findUnique({ where: { id: messageId } });
  }
  
  
  
}
