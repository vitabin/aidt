import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { NotificationService } from './application';
import { NotificationController } from './interface';
import { UserModule } from '../user';

@Module({
  providers: [NotificationService],
  controllers: [NotificationController],
  imports: [PrismaModule, UserModule],
  exports: [NotificationService],
})
export class NotificationModule {}
