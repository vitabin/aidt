import { Module } from '@nestjs/common';
import { SystemController } from './interface/system.controller';
import { SystemService } from './application/system.service';
import { PrismaModule } from 'src/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
