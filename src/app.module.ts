import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { MessageController } from './message/message.controller';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { NotificationController } from './notification/notification.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    MessageModule,
    NotificationModule,
  ],
  controllers: [AppController,MessageController,NotificationController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
