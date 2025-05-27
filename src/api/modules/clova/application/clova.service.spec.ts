import { Test, TestingModule } from '@nestjs/testing';
import { ClovaService } from './clova.service';

describe('ClovaService', () => {
  let service: ClovaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClovaService],
    }).compile();

    service = module.get<ClovaService>(ClovaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
