import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { ReportService } from './application';
import { ReportController } from './interface';

@Module({
  imports: [PrismaModule],
  providers: [ReportService],
  exports: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
