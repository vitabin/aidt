import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../application/dashboard.service';
import { HttpException } from '@nestjs/common';
import {
  DescendingPart,
  GetDescendingIn2StudentsDto,
  GetTeacherWeakChaptersDto,
  StudentAchievementLevelDto,
  StudentProgressRateDto,
  StudentStudyDurationDto,
  StudentWeakChaptersDto,
  TeacherWeakChaptersDto,
} from '../application/dto';
import { WinstonModule } from 'nest-winston';

describe('DashboardController', () => {
  let dashboardController: DashboardController;
  let dashboardService: DashboardService;

  const mockDashboardService = {
    getAccumulate: jest.fn(),
    getClassLearningHistory: jest.fn(),
    getStudentWeakChapters: jest.fn(),
    getStudentProgressRates: jest.fn(),
    getStudentStudyDurations: jest.fn(),
    getStuentAchievementLevels: jest.fn(),
    getAverageDataForStrategyComment: jest.fn(),
    getTeacherWeakChapters: jest.fn(),
    getAssessmentResultBoard: jest.fn(),
    getDescendingIn2SubsectionsStudents: jest.fn(),
  };

  const uuid = 'test-uuid';
  const getTeacherWeakChaptersDto: GetTeacherWeakChaptersDto = {
    learning_map_node_id: 1,
    uuids: ['uuid1', 'uuid2'],
  };
  const getDescendingIn2SubsectionsStudentsDto: GetDescendingIn2StudentsDto = {
    curriculumId: '12345678901234567890',
    studentIds: ['uuid1', 'uuid2'],
    fetchingParts: [DescendingPart.CORRECT_RATE, DescendingPart.LEARNING_LEVEL, DescendingPart.LEARNING_TIME, DescendingPart.PROBLEM_SOLVING_COUNT],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
      imports: [WinstonModule.forRoot({})],
    }).compile();

    dashboardController = module.get<DashboardController>(DashboardController);
    dashboardService = module.get<DashboardService>(DashboardService);
  });

  it('정의되어 있어야 합니다', () => {
    expect(dashboardController).toBeDefined();
  });

  describe('getStudentWeakChapters', () => {
    it('학생 취약 단원을 반환해야 합니다', async () => {
      const result = [new StudentWeakChaptersDto()];
      jest.spyOn(dashboardService, 'getStudentWeakChapters').mockResolvedValue(result);

      expect(await dashboardController.getStudentWeakChapters(uuid)).toBe(result);
    });

    // eslint-disable-next-line sonarjs/no-duplicate-string
    it('오류를 처리해야 합니다', async () => {
      const error = new Error('Error');
      jest.spyOn(dashboardService, 'getStudentWeakChapters').mockRejectedValue(error);

      await expect(dashboardController.getStudentWeakChapters(uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('getStudentProgressRates', () => {
    it('학생 진도율을 반환해야 합니다', async () => {
      const result = [new StudentProgressRateDto()];
      jest.spyOn(dashboardService, 'getStudentProgressRates').mockResolvedValue(result);

      expect(await dashboardController.getStudentProgressRates(uuid)).toBe(result);
    });

    it('오류를 처리해야 합니다', async () => {
      const error = new Error('Error');
      jest.spyOn(dashboardService, 'getStudentProgressRates').mockRejectedValue(error);

      await expect(dashboardController.getStudentProgressRates(uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('getStudentStudyDurations', () => {
    it('학생 학습 시간을 반환해야 합니다', async () => {
      const result = [new StudentStudyDurationDto()];
      jest.spyOn(dashboardService, 'getStudentStudyDurations').mockResolvedValue(result);

      expect(await dashboardController.getStudentStudyDurations(uuid)).toBe(result);
    });

    it('오류를 처리해야 합니다', async () => {
      const error = new Error('Error');
      jest.spyOn(dashboardService, 'getStudentStudyDurations').mockRejectedValue(error);

      await expect(dashboardController.getStudentStudyDurations(uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('getStuentAchievementLevels', () => {
    it('학생 성취 수준을 반환해야 합니다', async () => {
      const result = [new StudentAchievementLevelDto()];
      jest.spyOn(dashboardService, 'getStuentAchievementLevels').mockResolvedValue(result);

      expect(await dashboardController.getStuentAchievementLevels(uuid)).toBe(result);
    });

    it('오류를 처리해야 합니다', async () => {
      const error = new Error('Error');
      jest.spyOn(dashboardService, 'getStuentAchievementLevels').mockRejectedValue(error);

      await expect(dashboardController.getStuentAchievementLevels(uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('getTeacherWeakChapters', () => {
    it('선생님 취약 단원을 반환해야 합니다', async () => {
      const result = [new TeacherWeakChaptersDto()];
      jest.spyOn(dashboardService, 'getTeacherWeakChapters').mockResolvedValue(result);

      expect(await dashboardController.getTeacherWeakChapters(getTeacherWeakChaptersDto, uuid)).toBe(result);
    });

    it('오류를 처리해야 합니다', async () => {
      const error = new Error('Error');
      jest.spyOn(dashboardService, 'getTeacherWeakChapters').mockRejectedValue(error);

      await expect(dashboardController.getTeacherWeakChapters(getTeacherWeakChaptersDto, uuid)).rejects.toThrow(HttpException);
    });
  });

  describe('getDescendingIn2SubsectionsStudents', () => {
    it('하위 섹션의 학생들을 반환해야 합니다', async () => {
      jest.spyOn(dashboardService, 'getDescendingIn2SubsectionsStudents').mockResolvedValue({
        correctRateStudents: [],
        learningLevelStudents: [],
        learningTimeStudents: [],
        problemSolvingCountStudents: [],
      });

      expect(await dashboardController.getDescendingIn2SubsectionsStudents(getDescendingIn2SubsectionsStudentsDto)).toEqual({
        correctRate: [],
        learningLevel: [],
        learningTime: [],
        problemSolvingCount: [],
      });
    });
  });
});
