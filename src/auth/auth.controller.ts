import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
