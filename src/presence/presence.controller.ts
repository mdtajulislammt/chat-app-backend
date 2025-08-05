/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Param } from '@nestjs/common';
import { PresenceService } from './presence.service';

@Controller('presence')
export class PresenceController {
  constructor(private presenceService: PresenceService) {}
  @Get('last-seen/:id')
  async getLastSeen(@Param('id') id: string) {
    const lastSeen = await this.presenceService.getLastSeen(Number(id));
    return { userId: id, lastSeen };
  }

  @Get('online-users')
  async getOnlineUsers() {
    const users = await this.presenceService.getOnlineUsers();
    return { onlineUsers: users };
  }
}
