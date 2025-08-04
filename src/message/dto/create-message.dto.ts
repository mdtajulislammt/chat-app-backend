import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageStatus, MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsInt()
  senderId: number;

  @IsInt()
  receiverId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus = MessageStatus.SENT;
}
