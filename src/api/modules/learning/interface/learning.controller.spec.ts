import { Test, TestingModule } from '@nestjs/testing';
import { LearningController } from './learning.controller';
import { LearningService } from '../application/learning.service';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { HttpException } from '@nestjs/common';
import { AdjustLearningLevelOfStudentsDto } from '../application/dto';
import { WinstonModule } from 'nest-winston';

describe('LearningController', () => {
  let controller: LearningController;
  let service: LearningService;

  const mockLearningService = {
    adjustLearningLevelOfStudents: jest.fn(),
  };

  const classInfo: ClassInfo = {
    user_grade: 'grade1',
    user_class: 'class1',
    school_id: 'school1',
    semester: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningController],
      providers: [
        {
          provide: LearningService,
          useValue: mockLearningService,
        },
      ],
      imports: [WinstonModule.forRoot({})],
    }).compile();

    controller = module.get<LearningController>(LearningController);
    service = module.get<LearningService>(LearningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('adjustLearningLevelOfStudents', () => {
    it('학생들의 학습 단계를 성공적으로 조정해야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };

      mockLearningService.adjustLearningLevelOfStudents.mockResolvedValue('Success');

      await expect(controller.adjustLearningLevelOfStudents(dto, classInfo)).resolves.toBe('Success');
      expect(service.adjustLearningLevelOfStudents).toHaveBeenCalledWith(dto, classInfo);
    });

    it('학급 정보가 존재하지 않으면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };
      mockLearningService.adjustLearningLevelOfStudents.mockRejectedValue(new HttpException('주어진 정보에 맞는 학급정보가 DB에 존재하지 않습니다.', 404));

      await expect(controller.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('주어진 정보에 맞는 학급정보가 DB에 존재하지 않습니다.', 404),
      );
      expect(service.adjustLearningLevelOfStudents).toHaveBeenCalledWith(dto, classInfo);
    });

    it('학습 체계가 존재하지 않으면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };

      mockLearningService.adjustLearningLevelOfStudents.mockRejectedValue(new HttpException('주어진 정보에 맞는 학습체계가 DB에 존재하지 않습니다.', 404));

      await expect(controller.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('주어진 정보에 맞는 학습체계가 DB에 존재하지 않습니다.', 404),
      );
      expect(service.adjustLearningLevelOfStudents).toHaveBeenCalledWith(dto, classInfo);
    });

    it('주어진 레벨에 해당하는 학습 레벨이 없으면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 3 },
        ],
        curriculumId: 'curriculum1',
      };

      mockLearningService.adjustLearningLevelOfStudents.mockRejectedValue(new HttpException('레벨 3에 해당하는 학습 레벨을 찾을 수 없습니다.', 400));

      await expect(controller.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('레벨 3에 해당하는 학습 레벨을 찾을 수 없습니다.', 400),
      );
      expect(service.adjustLearningLevelOfStudents).toHaveBeenCalledWith(dto, classInfo);
    });

    it('예기치 않은 오류가 발생하면 오류를 발생시켜야 한다', async () => {
      const dto: AdjustLearningLevelOfStudentsDto = {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        curriculumId: 'curriculum1',
      };
      mockLearningService.adjustLearningLevelOfStudents.mockRejectedValue(new HttpException('사용자 업적을 생성하는 중 오류가 발생했습니다.', 500));

      await expect(controller.adjustLearningLevelOfStudents(dto, classInfo)).rejects.toThrow(
        new HttpException('사용자 업적을 생성하는 중 오류가 발생했습니다.', 500),
      );
      expect(service.adjustLearningLevelOfStudents).toHaveBeenCalledWith(dto, classInfo);
    });
  });
});
