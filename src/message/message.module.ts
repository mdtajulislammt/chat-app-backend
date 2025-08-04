import { Module, forwardRef } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { NotificationModule } from 'src/notification/notification.module';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [MessageController],
  providers: [MessageService, PrismaService, ChatGateway,NotificationService],
  exports: [MessageService],
})
export class MessageModule {}
