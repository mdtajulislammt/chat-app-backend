import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationController } from './notification.controller';
import { MessageModule } from 'src/message/message.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [ forwardRef(() => MessageModule), forwardRef(() => ChatModule)],
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
