import { Test, TestingModule } from '@nestjs/testing';
import { AidtDashboardController } from './aidt_dashboard.controller';

describe('AidtDashboardController', () => {
  let controller: AidtDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AidtDashboardController],
    }).compile();

    controller = module.get<AidtDashboardController>(AidtDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
