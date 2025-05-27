import { Test, TestingModule } from '@nestjs/testing';
import { AidtDashboardService } from './aidt_dashboard.service';

describe('AidtDashboardService', () => {
  let service: AidtDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AidtDashboardService],
    }).compile();

    service = module.get<AidtDashboardService>(AidtDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
