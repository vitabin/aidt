import { Test, TestingModule } from '@nestjs/testing';
import { KerisService } from './keris.service';

describe('KerisService', () => {
  let service: KerisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KerisService],
    }).compile();

    service = module.get<KerisService>(KerisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
