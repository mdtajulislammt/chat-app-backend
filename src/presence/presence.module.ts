import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PresenceController } from './presence.controller';

@Module({
  controllers: [PresenceController],
  providers: [PresenceGateway, PresenceService, PrismaService],
  exports: [PresenceService],
})
export class PresenceModule {}
