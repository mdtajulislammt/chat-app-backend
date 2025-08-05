import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(username: string, email: string, password: string, fullName?: string) {
    const hash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        fullName,
        password: hash,
        status: 'offline', // default
      },
    });

    return { message: 'User registered', userId: user.id };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, username: user.username, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
  
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
  
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });
  
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
    // Send email (using Mailtrap)
    await this.mailService.sendMail(
      email,
      '🔐 Password Reset Request',
      `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fc; padding: 40px 0;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(90deg, #4CAF50, #2E7D32); color: white; text-align: center; padding: 30px 20px;">
              <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
            </td>
          </tr>
    
          <tr>
            <td style="padding: 30px 40px; color: #333;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hello,
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                We received a request to reset your password for your <strong>ChatApp</strong> account.  
                Click the button below to securely set a new password:
              </p>
    
              <div style="text-align: center; margin-bottom: 40px;">
                <a href="${resetLink}" style="
                  background: linear-gradient(90deg, #4CAF50, #2E7D32);
                  color: white;
                  padding: 14px 28px;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
                  transition: 0.3s ease;
                ">Reset Password</a>
              </div>
    
              <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                This link will expire in <strong>15 minutes</strong>.  
                If you didn’t request this, please ignore this email.
              </p>
            </td>
          </tr>
    
          <tr>
            <td style="background-color: #f4f7fc; text-align: center; padding: 20px; font-size: 12px; color: #999;">
              &copy; ${new Date().getFullYear()} <strong>ChatApp</strong>. All rights reserved.<br>
              Sent securely with ❤️ from ChatApp
            </td>
          </tr>
        </table>
      </div>
      `
    );
    
  
    return { success: true, message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    // 1️⃣ Find user by token
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) throw new UnauthorizedException('Invalid or expired token');

    // 2️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3️⃣ Update password and clear token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true, message: 'Password reset successfully' };
  }

}
