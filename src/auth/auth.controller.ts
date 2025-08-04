import { Body, Controller, Post, Get, Query, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private prisma: PrismaService) {}

  @Post('register')
  async register(@Body() dto: { 
    username: string; 
    email: string; 
    password: string; 
    fullName?: string 
  }) {
    return this.authService.register(dto.username, dto.email, dto.password, dto.fullName);
  }

  @Post('login')
  async login(@Body() dto: { username: string; password: string }) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('forgot-password')
async forgotPassword(@Body('email') email: string) {
  return this.authService.requestPasswordReset(email);
}

@Post('reset-password')
async resetPassword(
  @Body('token') token: string,
  @Body('newPassword') newPassword: string,
) {
  return this.authService.resetPassword(token, newPassword);
}

@Get('reset-password')
async verifyResetToken(@Query('token') token: string) {
  const user = await this.prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
  });

  if (!user) {
    throw new NotFoundException('Invalid or expired token');
  }

  return { success: true, message: 'Token is valid' };
}




}
