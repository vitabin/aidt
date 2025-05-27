import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { LearningService } from './learning.service';
import { AdjustLearningLevelOfStudentsDto } from './dto';
import { ClassInfo } from 'src/libs/dto/class-info.dto';

describe('LearningService', () => {
  let service: LearningService;
  let prisma: PrismaService;

  const mockPrismaService = {
    school_class: {
      findFirst: jest.fn(),
    },
    learning_map_node: {
      findFirst: jest.fn(),
    },
    learning_level: {
      findMany: jest.fn(),
    },
    user_achievement: {
      create: jest.fn(),
    },
    $transaction: jest.fn((transactions) => Promise.all(transactions)),
  };

  const classInfo: ClassInfo = {
    user_grade: 'grade1',
    user_class: 'class1',
    school_id: 'school1',
    semester: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('adjustLearningLevelOfStudents', () => {
    it('학습 레벨을 성공적으로 조정해야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };

      mockPrismaService.school_class.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.learning_map_node.findFirst.mockResolvedValue({
        id: 1,
        learning_sys_id: 1,
      });
      mockPrismaService.learning_level.findMany.mockResolvedValue([
        { id: 1, level: 1 },
        { id: 2, level: 2 },
      ]);
      mockPrismaService.user_achievement.create.mockResolvedValue({ id: 1 });

      await expect(service.adjustLearningLevelOfStudents(dto, classInfo)).resolves.not.toThrow();

      expect(prisma.school_class.findFirst).toHaveBeenCalledWith({
        where: {
          grade: classInfo.user_grade,
          class: classInfo.user_class,
          school: {
            school_id: classInfo.school_id,
          },
        },
      });
      expect(prisma.learning_map_node.findFirst).toHaveBeenCalledWith({
        where: {
          learning_sys: { cls_id: dto.curriculumId },
        },
      });
      expect(prisma.learning_level.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          level: true,
        },
        where: {
          learning_level_group: {
            is_default: true,
          },
        },
      });
      expect(prisma.user_achievement.create).toHaveBeenCalledTimes(2);
    });

    it('학급 정보가 존재하지 않으면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };

      mockPrismaService.school_class.findFirst.mockResolvedValue(null);

      await expect(service.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('주어진 정보에 맞는 학급정보가 DB에 존재하지 않습니다.', 404),
      );
    });

    it('학습 체계가 존재하지 않으면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };
      mockPrismaService.school_class.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.learning_map_node.findFirst.mockResolvedValue(null);

      await expect(service.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('주어진 정보에 맞는 학습체계가 DB에 존재하지 않습니다.', 404),
      );
    });

    it('주어진 레벨에 해당하는 학습 레벨이 없으면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 3 }, // 레벨 3은 존재하지 않음
        ],
        curriculumId: 'curriculum1',
      };
      mockPrismaService.school_class.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.learning_map_node.findFirst.mockResolvedValue({
        id: 1,
        learning_sys_id: 1,
      });
      mockPrismaService.learning_level.findMany.mockResolvedValue([
        { id: 1, level: 1 },
        { id: 2, level: 2 },
      ]);

      await expect(service.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('레벨 3에 해당하는 학습 레벨을 찾을 수 없습니다.', 400),
      );
    });

    it('예기치 않은 오류가 발생하면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };

      mockPrismaService.school_class.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.learning_map_node.findFirst.mockResolvedValue({
        id: 1,
        learning_sys_id: 1,
      });
      mockPrismaService.learning_level.findMany.mockResolvedValue([
        { id: 1, level: 1 },
        { id: 2, level: 2 },
      ]);
      mockPrismaService.user_achievement.create.mockRejectedValue(new Error('Unexpected error'));

      await expect(service.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('사용자 업적을 생성하는 중 오류가 발생했습니다.', 500),
      );
    });
  });
});
