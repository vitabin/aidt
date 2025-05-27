import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma';
import { ProblemSolvingScope, ProblemSolvingStatus } from '@prisma/client';
import { ProblemSolvingQueryRepository } from './problem-solving.query';
import { WinstonModule } from 'nest-winston';

describe('ProblemSolvingQueryRepository', () => {
  let repository: ProblemSolvingQueryRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemSolvingQueryRepository,
        {
          provide: PrismaService,
          useValue: {
            problem_solving: {
              findMany: jest.fn(),
            },
            concept_video: {
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            concept_video_share: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
      imports: [WinstonModule.forRoot({})],
    }).compile();

    repository = module.get<ProblemSolvingQueryRepository>(ProblemSolvingQueryRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getSolvedProblemsById', () => {
    it('유효한 사용자 UUID를 전달하면 해결된 문제 목록을 반환해야 합니다', async () => {
      const uuid = 'some-uuid';
      const problems = [
        {
          id: 1,
          problem_id: 1,
          user_uuid: uuid,
          video_path: null,
          status: ProblemSolvingStatus.SAVED,
          pinned: false,
          scope: ProblemSolvingScope.ALL,
          created_at: new Date(),
          deleted_at: null,
        },
      ];
      jest.spyOn(prisma.problem_solving, 'findMany').mockResolvedValue(problems);

      expect(await repository.getSolvedProblemsById(uuid)).toBe(problems);
      expect(prisma.problem_solving.findMany).toHaveBeenCalledWith({
        where: {
          user_uuid: uuid,
        },
        include: {
          problem_solving_meta: true,
        },
      });
    });
  });
});
