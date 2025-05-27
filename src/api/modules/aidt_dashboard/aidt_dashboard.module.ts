import { Module } from '@nestjs/common';
import { AidtDashboardController } from './aidt_dashboard.controller';
import { AidtDashboardService } from './aidt_dashboard.service';
import { HistoryService } from 'src/history/history.service';
import { KerisService } from '../keris/application/keris.service';

@Module({
  controllers: [AidtDashboardController],
  providers: [AidtDashboardService, HistoryService, KerisService],
})
export class AidtDashboardModule {}
