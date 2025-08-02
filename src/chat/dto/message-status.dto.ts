import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export class MessageStatusDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsEnum(MessageStatus)
  status: MessageStatus;
} 