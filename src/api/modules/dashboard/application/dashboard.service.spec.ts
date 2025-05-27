/* eslint-disable sonarjs/no-duplicate-string */
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from '../../problem';
import { StudyQueryRepository } from '../../study';
import { QuestionService } from '../../question/application/question.service';
import { WinstonModule } from 'nest-winston';
import {
  GetTeacherWeakChaptersDto,
  TeacherWeakChaptersDto,
  StudentWeakChaptersDto,
  StudentProgressRateDto,
  StudentStudyDurationDto,
  GetDescendingIn2StudentsDto,
  DescendingPart,
} from './dto';
import { learning_map_node } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { ConfigService } from '@nestjs/config';
import { LearningSysMapNodeQueryRepository, LearningSysQueryRepository } from '../../learning';
import { UserAchievementService } from '../../user_achievement/application';

describe('DashboardService', () => {
  let service: DashboardService;
  let studyQuery: StudyQueryRepository;
  let problemQuery: ProblemQueryRepository;
  let problemSolvingQuery: ProblemSolvingQueryRepository;

  const recent3Nodes: learning_map_node[] = [
    {
      id: 1,
      learning_map_id: 1,
      learning_sys_id: 1,
      pre_learning_map_id: 1,
      link_prev: null,
      link_next: null,
      created_at: new Date(),
      updated_at: new Date(),
      week: 1,
    },
    {
      id: 2,
      learning_map_id: 1,
      learning_sys_id: 2,
      pre_learning_map_id: 1,
      link_prev: null,
      link_next: null,
      created_at: new Date(),
      updated_at: new Date(),
      week: 1,
    },
    {
      id: 3,
      learning_map_id: 1,
      learning_sys_id: 3,
      pre_learning_map_id: 1,
      link_prev: null,
      link_next: null,
      created_at: new Date(),
      week: 1,
      updated_at: new Date(),
    },
  ];

  const learningLevelMock = {
    id: 1,
    name: 'Beginner',
    level: 1,
    level_group: 1,
    achievement_score_from: 0,
    achievement_score_to: 10,
    total_quest_count: 5,
    lv_0_count: 2,
    lv_0_difficulty: 1,
    lv_1_count: 2,
    lv_1_difficulty: 2,
    lv_2_count: 1,
    lv_2_difficulty: 3,
    lv_3_count: 0,
    lv_3_difficulty: 0,
    created_at: new Date('2024-06-19T00:00:00Z'),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    study: {
      findMany: jest.fn(),
    },
    study_problem: {
      findMany: jest.fn(),
    },
    study_perform: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    learning_sys: {
      findUnique: jest.fn(),
    },
    assessment_problem: {
      findMany: jest.fn(),
    },
    assessment_perform: {
      findMany: jest.fn(),
    },
    user_achievement: {
      findMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
    learning_map_node: {
      findFirst: jest.fn(),
    },
    problem_solving: {
      findMany: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    problem: {
      findMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WinstonModule.forRoot({})],
      providers: [
        DashboardService,
        ProblemQueryRepository,
        ProblemSolvingQueryRepository,
        QuestionService,
        StudyQueryRepository,
        LearningSysMapNodeQueryRepository,
        UserAchievementService,
        LearningSysQueryRepository,
        ConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
    studyQuery = module.get<StudyQueryRepository>(StudyQueryRepository);
    problemQuery = module.get<ProblemQueryRepository>(ProblemQueryRepository);
    problemSolvingQuery = module.get<ProblemSolvingQueryRepository>(ProblemSolvingQueryRepository);
  });

  // describe('getAccumulate', () => {
  //   it('누적 데이터를 리턴, 없으면 0을 리턴', async () => {
  //     const studentsUuids = ['asdf', 'asdf'];
  //     const user_uuid = 'test';

  //     jest.spyOn(studyQuery, 'getStudyPerformByUuids').mockResolvedValue([]);
  //     jest.spyOn(problemQuery, 'findMany').mockResolvedValue([]);
  //     jest.spyOn(problemSolvingQuery, 'getSolvedProblemsByIds').mockResolvedValue([]);

  //     const expected = {
  //       userSolved: 0,
  //       classSolved: 0,
  //       userCorrectRate: 0,
  //       classCorrectRate: 0,
  //       userQnA: 0,
  //       classQnA: 0,
  //     };

  //     const result = await service.getAccumulate1Page(studentsUuids, user_uuid);
  //     expect(result).toEqual(expected);
  //   });
  // });

  describe('getStudentWeakChapters', () => {
    it('학생 취약 단원을 반환해야 합니다', async () => {
      const uuid = 'test-uuid';
      const currentUser = {
        user_uuid: uuid,
        current_learning_node_id: 1,
      };
      const learningSys = { id: 1, name: 'test' };
      const studies = [{ id: 1 }];
      const studyProblems = [
        {
          id: 1,
          study_id: 1,
          problem: { difficulty: 'LOW' },
        },
      ];
      const studyPerform = { is_correct: 1 };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(currentUser);
      jest.spyOn(service['learningSysMapQueryRepository'], 'getRecent3NodesByNodeId').mockResolvedValue(recent3Nodes);
      jest.spyOn(mockPrismaService.learning_sys, 'findUnique').mockResolvedValue(learningSys);
      jest.spyOn(mockPrismaService.study, 'findMany').mockResolvedValue(studies);
      jest.spyOn(mockPrismaService.study_problem, 'findMany').mockResolvedValue(studyProblems);
      jest.spyOn(mockPrismaService.study_perform, 'findFirst').mockResolvedValue(studyPerform);

      const expected: Partial<StudentWeakChaptersDto>[] = [
        {
          chapterName: 'test',
          HIGHEST: [0, 0],
          HIGH: [0, 0],
          MIDDLE: [0, 0],
          LOW: [1, 0],
          SUM: [1, 0],
        },
        {
          chapterName: 'test',
          HIGHEST: [0, 0],
          HIGH: [0, 0],
          MIDDLE: [0, 0],
          LOW: [1, 0],
          SUM: [1, 0],
        },
        {
          chapterName: 'test',
          HIGHEST: [0, 0],
          HIGH: [0, 0],
          MIDDLE: [0, 0],
          LOW: [1, 0],
          SUM: [1, 0],
        },
      ];

      expect(await service.getStudentWeakChapters(uuid)).toEqual(expected);
    });

    it('오류를 처리해야 합니다', async () => {
      const uuid = 'test-uuid';
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getStudentWeakChapters(uuid)).rejects.toThrow('학생의 학습 이력 정보를 찾을 수 없습니다.');
    });
  });

  describe('getTeacherWeakChapters', () => {
    it('선생님 취약 단원을 반환해야 합니다', async () => {
      const dto: GetTeacherWeakChaptersDto = {
        learning_map_node_id: 1,
        uuids: ['test-uuid'],
      };
      const uuid = 'teacher-uuid';
      const currentUser = { user_uuid: uuid };

      const learningSys = { id: 1, name: 'test' };
      const studies = [{ id: 1 }];
      const studyProblems = [
        {
          id: 1,
          study_id: 1,
          problem: { difficulty: 'LOW' },
        },
      ];
      const studyPerforms = [{ is_correct: 1, user_uuid: 'test-uuid' }];

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(currentUser);
      jest.spyOn(service['learningSysMapQueryRepository'], 'getRecent3NodesByNodeId').mockResolvedValue(recent3Nodes);
      jest.spyOn(mockPrismaService.learning_sys, 'findUnique').mockResolvedValue(learningSys);
      jest.spyOn(mockPrismaService.study, 'findMany').mockResolvedValue(studies);
      jest.spyOn(mockPrismaService.study_problem, 'findMany').mockResolvedValue(studyProblems);
      jest.spyOn(mockPrismaService.study_perform, 'findMany').mockResolvedValue(studyPerforms);

      const expected: Partial<TeacherWeakChaptersDto>[] = [
        {
          chapterName: 'test',
          HIGHEST: [0, 0],
          HIGH: [0, 0],
          MIDDLE: [0, 0],
          LOW: [1, 0],
          SUM: [1, 0],
        },
        {
          chapterName: 'test',
          HIGHEST: [0, 0],
          HIGH: [0, 0],
          MIDDLE: [0, 0],
          LOW: [1, 0],
          SUM: [1, 0],
        },
        {
          chapterName: 'test',
          HIGHEST: [0, 0],
          HIGH: [0, 0],
          MIDDLE: [0, 0],
          LOW: [1, 0],
          SUM: [1, 0],
        },
      ];

      expect(await service.getTeacherWeakChapters(dto, uuid)).toEqual(expected);
    });

    it('오류를 처리해야 합니다', async () => {
      const dto: GetTeacherWeakChaptersDto = {
        learning_map_node_id: 1,
        uuids: ['test-uuid'],
      };
      const uuid = 'teacher-uuid';
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getTeacherWeakChapters(dto, uuid)).rejects.toThrow('가입되지 않은 선생님입니다.');
    });
  });

  describe('getStudentProgressRates', () => {
    it('학생 진도율을 반환해야 합니다', async () => {
      const uuid = 'test-uuid';
      const currentUser = {
        user_uuid: uuid,
        current_learning_node_id: 1,
      };
      const learningSys = { id: 1, name: 'test' };
      const studies = [{ id: 1 }];
      const studyProblems = [
        {
          id: 1,
          study_id: 1,
        },
      ];
      const studyPerform = { study_problem_id: 1, user_uuid: uuid };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(currentUser);
      jest.spyOn(service['learningSysMapQueryRepository'], 'getRecent3NodesByNodeId').mockResolvedValue(recent3Nodes);
      jest.spyOn(mockPrismaService.learning_sys, 'findUnique').mockResolvedValue(learningSys);
      jest.spyOn(mockPrismaService.study, 'findMany').mockResolvedValue(studies);
      jest.spyOn(mockPrismaService.study_problem, 'findMany').mockResolvedValue(studyProblems);
      jest.spyOn(mockPrismaService.study_perform, 'findFirst').mockResolvedValue(studyPerform);

      const expected: Partial<StudentProgressRateDto>[] = [
        {
          chapterName: 'test',
          learningMapNodeId: 1,
          progressRate: 8.333333333333332,
        },
        {
          chapterName: 'test',
          learningMapNodeId: 2,
          progressRate: 8.333333333333332,
        },
        {
          chapterName: 'test',
          learningMapNodeId: 3,
          progressRate: 8.333333333333332,
        },
      ];

      expect(await service.getStudentProgressRates(uuid)).toEqual(expected);
    });

    it('오류를 처리해야 합니다', async () => {
      const uuid = 'test-uuid';
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getStudentProgressRates(uuid)).rejects.toThrow('학생의 학습 이력 정보를 찾을 수 없습니다.');
    });
  });

  describe('getStudentStudyDurations', () => {
    it('학생 학습 시간을 반환해야 합니다', async () => {
      const uuid = 'test-uuid';
      const currentUser = {
        user_uuid: uuid,
        current_learning_node_id: 1,
      };
      const learningSys = { id: 1, name: 'test' };
      const studies = [{ id: 1 }];
      const studyProblems = [
        {
          id: 1,
          study_id: 1,
        },
      ];
      const studyPerform = {
        study_problem_id: 1,
        user_uuid: uuid,
        solving_start: new Date(),
        solving_end: new Date(new Date().getTime() + 60000), // 60 seconds later
      };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(currentUser);
      jest.spyOn(service['learningSysMapQueryRepository'], 'getRecent3NodesByNodeId').mockResolvedValue(recent3Nodes);
      jest.spyOn(mockPrismaService.learning_sys, 'findUnique').mockResolvedValue(learningSys);
      jest.spyOn(mockPrismaService.study, 'findMany').mockResolvedValue(studies);
      jest.spyOn(mockPrismaService.study_problem, 'findMany').mockResolvedValue(studyProblems);
      jest.spyOn(mockPrismaService.study_perform, 'findFirst').mockResolvedValue(studyPerform);

      const expected: Partial<StudentStudyDurationDto>[] = [
        {
          chapterName: 'test',
          learningMapNodeId: 1,
          studyDuration: 60,
        },
        {
          chapterName: 'test',
          learningMapNodeId: 1,
          studyDuration: 60,
        },
        {
          chapterName: 'test',
          learningMapNodeId: 1,
          studyDuration: 60,
        },
      ];

      expect(await service.getStudentStudyDurations(uuid)).toEqual(expected);
    });

    it('오류를 처리해야 합니다', async () => {
      const uuid = 'test-uuid';
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getStudentStudyDurations(uuid)).rejects.toThrow('학생의 학습 이력 정보를 찾을 수 없습니다.');
    });
  });

  describe('getDescendingIn2SubsectionsStudents', () => {
    it('성적이 세 노드에 걸쳐 하락한 학생들을 반환해야 합니다.', async () => {
      const dto: GetDescendingIn2StudentsDto = {
        curriculumId: 'test-curriculum-id',
        studentIds: ['user1', 'user2'],
        fetchingParts: [DescendingPart.LEARNING_LEVEL, DescendingPart.PROBLEM_SOLVING_COUNT, DescendingPart.CORRECT_RATE],
      };

      const learning_map_node = { id: 1, learning_sys_id: 1 };
      const previous_learning_map_node = { id: 2, learning_sys_id: 2 };
      const pre_previous_learning_map_node = { id: 3, learning_sys_id: 3 };

      const achievement = [
        { user_uuid: 'user1', learning_map_node_id: 1, learning_level: { ...learningLevelMock, level: 1 } },
        { user_uuid: 'user1', learning_map_node_id: 2, learning_level: { ...learningLevelMock, level: 2 } },
        { user_uuid: 'user1', learning_map_node_id: 3, learning_level: { ...learningLevelMock, level: 3 } },
        { user_uuid: 'user2', learning_map_node_id: 1, learning_level: learningLevelMock },
        { user_uuid: 'user2', learning_map_node_id: 2, learning_level: learningLevelMock },
        { user_uuid: 'user2', learning_map_node_id: 3, learning_level: learningLevelMock },
      ];

      const studyPerform = [
        { user_uuid: 'user1', study_problem: { study: { learning_sys_id: 1 } }, is_correct: 1 },
        { user_uuid: 'user1', study_problem: { study: { learning_sys_id: 2 } }, is_correct: 0 },
        { user_uuid: 'user1', study_problem: { study: { learning_sys_id: 3 } }, is_correct: 0 },
        { user_uuid: 'user2', study_problem: { study: { learning_sys_id: 1 } }, is_correct: 1 },
        { user_uuid: 'user2', study_problem: { study: { learning_sys_id: 2 } }, is_correct: 1 },
        { user_uuid: 'user2', study_problem: { study: { learning_sys_id: 3 } }, is_correct: 1 },
      ];

      jest
        .spyOn(mockPrismaService.learning_map_node, 'findFirst')
        .mockResolvedValueOnce(learning_map_node)
        .mockResolvedValueOnce(previous_learning_map_node)
        .mockResolvedValueOnce(pre_previous_learning_map_node);
      jest.spyOn(mockPrismaService.user_achievement, 'findMany').mockResolvedValue(achievement);
      jest.spyOn(mockPrismaService.study_perform, 'findMany').mockResolvedValue(studyPerform);

      const result = await service.getDescendingIn2SubsectionsStudents(dto);
      expect(result).toEqual({
        learningLevelStudents: ['user1', 'user2'],
        problemSolvingCountStudents: [],
        correctRateStudents: [],
        learningTimeStudents: [],
      });
    });

    it('하락한 학생이 없으면 빈 배열을 반환해야 합니다.', async () => {
      const dto: GetDescendingIn2StudentsDto = {
        curriculumId: 'test-curriculum-id',
        studentIds: ['user1', 'user2'],
        fetchingParts: [DescendingPart.LEARNING_LEVEL, DescendingPart.PROBLEM_SOLVING_COUNT, DescendingPart.CORRECT_RATE],
      };

      const learning_map_node = { id: 1, learning_sys_id: 1 };
      const previous_learning_map_node = { id: 2, learning_sys_id: 2 };
      const pre_previous_learning_map_node = { id: 3, learning_sys_id: 3 };

      const achievement = [
        { user_uuid: 'user1', learning_map_node_id: 1, learning_level: { ...learningLevelMock, level: 2 } },
        { user_uuid: 'user1', learning_map_node_id: 2, learning_level: { ...learningLevelMock, level: 2 } },
        { user_uuid: 'user1', learning_map_node_id: 3, learning_level: { ...learningLevelMock, level: 2 } },
        { user_uuid: 'user2', learning_map_node_id: 1, learning_level: { ...learningLevelMock, level: 2 } },
        { user_uuid: 'user2', learning_map_node_id: 2, learning_level: { ...learningLevelMock, level: 2 } },
        { user_uuid: 'user2', learning_map_node_id: 3, learning_level: { ...learningLevelMock, level: 2 } },
      ];

      const studyPerform = [
        { user_uuid: 'user1', study_problem: { study: { learning_sys_id: 1 } }, is_correct: 1 },
        { user_uuid: 'user1', study_problem: { study: { learning_sys_id: 2 } }, is_correct: 1 },
        { user_uuid: 'user1', study_problem: { study: { learning_sys_id: 3 } }, is_correct: 1 },
        { user_uuid: 'user2', study_problem: { study: { learning_sys_id: 1 } }, is_correct: 1 },
        { user_uuid: 'user2', study_problem: { study: { learning_sys_id: 2 } }, is_correct: 1 },
        { user_uuid: 'user2', study_problem: { study: { learning_sys_id: 3 } }, is_correct: 1 },
      ];

      jest
        .spyOn(mockPrismaService.learning_map_node, 'findFirst')
        .mockResolvedValueOnce(learning_map_node)
        .mockResolvedValueOnce(previous_learning_map_node)
        .mockResolvedValueOnce(pre_previous_learning_map_node);
      jest.spyOn(mockPrismaService.user_achievement, 'findMany').mockResolvedValue(achievement);
      jest.spyOn(mockPrismaService.study_perform, 'findMany').mockResolvedValue(studyPerform);

      const result = await service.getDescendingIn2SubsectionsStudents(dto);
      expect(result).toEqual({
        learningLevelStudents: [],
        problemSolvingCountStudents: [],
        correctRateStudents: [],
        learningTimeStudents: [],
      });
    });

    it('성취 기록이 없는 경우를 처리해야 합니다.', async () => {
      const dto: GetDescendingIn2StudentsDto = {
        curriculumId: 'test-curriculum-id',
        studentIds: ['user1', 'user2'],
        fetchingParts: [DescendingPart.LEARNING_LEVEL, DescendingPart.PROBLEM_SOLVING_COUNT, DescendingPart.CORRECT_RATE],
      };

      const learning_map_node = { id: 1, learning_sys_id: 1 };
      const previous_learning_map_node = { id: 2, learning_sys_id: 2 };
      const pre_previous_learning_map_node = { id: 3, learning_sys_id: 3 };

      jest
        .spyOn(mockPrismaService.learning_map_node, 'findFirst')
        .mockResolvedValueOnce(learning_map_node)
        .mockResolvedValueOnce(previous_learning_map_node)
        .mockResolvedValueOnce(pre_previous_learning_map_node);
      jest.spyOn(mockPrismaService.user_achievement, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrismaService.study_perform, 'findMany').mockResolvedValue([]);

      const result = await service.getDescendingIn2SubsectionsStudents(dto);
      expect(result).toEqual({
        learningLevelStudents: [],
        problemSolvingCountStudents: [],
        correctRateStudents: [],
        learningTimeStudents: [],
      });
    });

    it('이전 노드를 찾을 수 없는 경우 빈 배열을 반환해야 합니다.', async () => {
      const dto: GetDescendingIn2StudentsDto = {
        curriculumId: 'test-curriculum-id',
        studentIds: ['user1', 'user2'],
        fetchingParts: [DescendingPart.LEARNING_LEVEL, DescendingPart.PROBLEM_SOLVING_COUNT, DescendingPart.CORRECT_RATE],
      };

      const learning_map_node = { id: 1, learning_sys_id: 1 };

      jest.spyOn(mockPrismaService.learning_map_node, 'findFirst').mockResolvedValueOnce(learning_map_node).mockResolvedValueOnce(null);

      const result = await service.getDescendingIn2SubsectionsStudents(dto);
      expect(result).toEqual({});
    });

    it('pre-previous 노드를 찾을 수 없는 경우 빈 배열을 반환해야 합니다.', async () => {
      const dto: GetDescendingIn2StudentsDto = {
        curriculumId: 'test-curriculum-id',
        studentIds: ['user1', 'user2'],
        fetchingParts: [DescendingPart.LEARNING_LEVEL, DescendingPart.PROBLEM_SOLVING_COUNT, DescendingPart.CORRECT_RATE],
      };

      const learning_map_node = { id: 1, learning_sys_id: 1 };
      const previous_learning_map_node = { id: 2, learning_sys_id: 2 };

      jest
        .spyOn(mockPrismaService.learning_map_node, 'findFirst')
        .mockResolvedValueOnce(learning_map_node)
        .mockResolvedValueOnce(previous_learning_map_node)
        .mockResolvedValueOnce(null);

      const result = await service.getDescendingIn2SubsectionsStudents(dto);
      expect(result).toEqual({});
    });
  });
});
