import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageStatusDto } from './dto/message-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Get('history/:userId')
  getChatHistory(@Request() req, @Param('userId') otherUserId: string) {
    return this.chatService.getChatHistory(req.user.id, +otherUserId);
  }

  @Post('status')
  updateMessageStatus(@Body() messageStatusDto: MessageStatusDto) {
    return this.chatService.updateMessageStatus(messageStatusDto);
  }

  @Get('unread')
  getUnreadMessages(@Request() req) {
    return this.chatService.getUnreadMessages(req.user.id);
  }

  @Post('mark-read/:senderId')
  markMessagesAsRead(@Request() req, @Param('senderId') senderId: string) {
    return this.chatService.markMessagesAsRead(req.user.id, +senderId);
  }
} 