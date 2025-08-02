import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  receiverId?: number;

  @IsString()
  @IsOptional()
  roomId?: string;
} 