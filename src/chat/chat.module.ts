import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageModule } from 'src/message/message.module';
import { NotificationModule } from 'src/notification/notification.module';
import { NotificationService } from 'src/notification/notification.service';

@Module({
    imports: [forwardRef(() => MessageModule), forwardRef(() => NotificationModule)],
  providers: [ChatGateway, ChatService, PrismaService,NotificationService,],
  exports: [ChatGateway],
})
export class ChatModule {}
