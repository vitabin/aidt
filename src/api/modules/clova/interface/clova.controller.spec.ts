import { Test, TestingModule } from '@nestjs/testing';
import { ClovaController } from './interface/clova.controller';

describe('ClovaController', () => {
  let controller: ClovaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClovaController],
    }).compile();

    controller = module.get<ClovaController>(ClovaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
