import { Module } from '@nestjs/common';
import { AnnouncementController } from './interface/announcement.controller';
import { AnnouncementService } from '../announcement/application';
import { PrismaModule } from 'src/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [AnnouncementController],
  providers: [AnnouncementService]
})
export class AnnouncementModule {}
