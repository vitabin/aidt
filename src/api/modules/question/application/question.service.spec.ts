import { Test, TestingModule } from '@nestjs/testing';
import { QuestionService } from './question.service';
import {
  Difficulty,
  problem,
  question,
  ProblemSolvingScope,
  ProblemSolvingStatus,
  ProblemType,
  learning_sys,
  UnitType,
  QuestionStatus,
  AnswerType,
  ContentStatus,
  problem_solving,
} from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { GetQuestionsDto } from './dto/getQuestions.dto';
import { GetQuestionAnswersDto } from './dto';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('QuestionService', () => {
  let service: QuestionService;
  let prisma: DeepMockProxy<PrismaService>;
  let cacheManager: DeepMockProxy<Cache>;

  const classInfo: ClassInfo = { user_grade: '1', user_class: '1', school_id: 'school-id', semester: 1 };

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<QuestionService>(QuestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('putQuestionForProblem', () => {
    it('문제가 존재하지 않으면 예외를 던져야 합니다.', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(null);

      await expect(service.putQuestionForProblem(1, 'user-uuid', 'title')).rejects.toThrow(new HttpException('문제를 찾을 수 없습니다.', 404));
    });

    it('문제가 삭제된 경우 예외를 던져야 합니다.', async () => {
      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue({
        id: 1,
        deleted_at: new Date(),
        cls_id: '111',
        curriculum: 'curriculum',
        difficulty: Difficulty.LOW,
        latex_data: 'latex_data',
        answer_data: 'answer_data',
        answer_type: 'answer_type',
        created_at: new Date(),
      } as any);

      await expect(service.putQuestionForProblem(1, 'user-uuid', 'title')).rejects.toThrow(new HttpException('삭제된 문제입니다.', 404));
    });

    it('문제에 대한 질문을 생성해야 합니다.', async () => {
      const mockProblem: problem = {
        id: 1,
        deleted_at: null,
        cls_id: '111',
        difficulty: Difficulty.LOW,
        latex_data: 'latex_data',
        answer_data: 'answer_data',
        answer_type: AnswerType.MULTISELECT,
        created_at: new Date(),
        type: ProblemType.DIAGNOSTIC,
        target_grade: 1,
        target_semester: 1,
        ai_hint: 'ai_hint',
        content_status: ContentStatus.ACTIVED,
        detail_solution: 'detail_solution',
        explanation: 'explanation',
        is_algeomath: true,
        is_ebs: true,
        manage_no: '111',
        updated_at: new Date(),
      };

      const mockLearningSys: learning_sys = {
        id: 111,
        learning_sys_doc_id: 1,
        cls_id: '1234123',
        deleted_at: null,
        created_at: new Date(),
        type: UnitType.CHAPTER,
        name: 'name',
        full_name: 'full_name',
        index: 1,
        achievement_desc: 'achievement_desc',
        achievement_id: 'achievement_id',
        parent_id: 112,
        is_deleted: false,
        updated_at: new Date(),
        pre_learning_map_id: 1,
        grade: 1,
        semester: 1,
      };

      jest.spyOn(prisma.problem, 'findUnique').mockResolvedValue(mockProblem);
      jest.spyOn(prisma.learning_sys, 'findFirst').mockResolvedValue(mockLearningSys);
      const createSpy = jest.spyOn(prisma.question, 'create').mockResolvedValue({
        id: 1,
        problem_id: mockProblem.id,
        question_user_uuid: 'user-uuid',
        learning_sys_id: mockLearningSys.id,
        created_at: new Date(),
        title: 'title',
      } as any);

      await service.putQuestionForProblem(1, 'user-uuid', 'title');

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          problem_id: 1,
          question_user_uuid: 'user-uuid',
          learning_sys_id: 111,
          title: 'title',
        },
      });
    });
  });

  describe('getQuestionForProblem', () => {
    const mockQuestion: question = {
      id: 1,
      problem_id: 1,
      question_user_uuid: 'user-uuid',
      learning_sys_id: 111,
      created_at: new Date(),
      title: 'title',
      problem_solving_id: null,
      solving_user_uuid: null,
      solving_video_id: null,
      status: QuestionStatus.IDLE,
      deleted_at: null,
    };

    it('등록된 질문이 없으면 빈 배열을 반환해야 합니다.', async () => {
      jest.spyOn(prisma.question, 'count').mockResolvedValue(0);
      const dto: GetQuestionsDto = { onlyMine: false, page: 1, pageSize: 10 };

      await expect(service.getQuestionForProblem(dto, 'user-uuid')).resolves.toEqual({ questions: [], totalPage: 0 });

      expect(prisma.question.count).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          learning_sys: undefined,
        },
      });
    });

    it('해당 페이지에 질문이 없으면 빈 배열을 출력해야 합니다.', async () => {
      jest.spyOn(prisma.question, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.question, 'findMany').mockResolvedValue([]);
      const dto: GetQuestionsDto = { onlyMine: false, page: 2, pageSize: 10 };

      await expect(service.getQuestionForProblem(dto, 'user-uuid')).resolves.toEqual({ questions: [], totalPage: 1 });

      expect(prisma.question.count).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          learning_sys: undefined,
        },
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          learning_sys: undefined,
          question_user_uuid: undefined,
        },
        orderBy: { created_at: 'desc' },
        include: { problem_solving: true, problem: { select: { answer_type: true, latex_data: true, cls_id: true } } },
        skip: 10,
        take: 10,
      });
    });

    it('onlyMine이 true일 때, 사용자 자신의 질문을 반환해야 합니다.', async () => {
      jest.spyOn(prisma.question, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.question, 'findMany').mockResolvedValue([mockQuestion]);
      const dto: GetQuestionsDto = { onlyMine: true, page: 1, pageSize: 10 };

      const result = await service.getQuestionForProblem(dto, 'user-uuid');

      expect(result).toEqual({
        questions: [mockQuestion],
        totalPage: 1,
      });

      expect(prisma.question.count).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          learning_sys: undefined,
          question_user_uuid: 'user-uuid',
        },
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          learning_sys: undefined,
          question_user_uuid: 'user-uuid',
        },
        orderBy: { created_at: 'desc' },
        include: { problem_solving: true, problem: { select: { answer_type: true, latex_data: true, cls_id: true } } },
        skip: 0,
        take: 10,
      });
    });

    it('titleKeyword가 주어졌을 때, 해당 키워드를 포함하는 제목의 질문을 반환해야 합니다.', async () => {
      jest.spyOn(prisma.question, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.question, 'findMany').mockResolvedValue([mockQuestion]);
      const dto: GetQuestionsDto = { onlyMine: false, page: 1, pageSize: 10, titleKeyword: 'title' };

      const result = await service.getQuestionForProblem(dto, 'user-uuid');

      expect(result).toEqual({
        questions: [mockQuestion],
        totalPage: 1,
      });

      expect(prisma.question.count).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: { contains: 'title' },
          learning_sys: undefined,
        },
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: { contains: 'title' },
          learning_sys: undefined,
          question_user_uuid: undefined,
        },
        orderBy: { created_at: 'desc' },
        include: { problem_solving: true, problem: { select: { answer_type: true, latex_data: true, cls_id: true } } },
        skip: 0,
        take: 10,
      });
    });

    it('unitNameKeyword가 주어졌을 때, 해당 키워드를 포함하는 유닛 이름의 질문을 반환해야 합니다.', async () => {
      const mockQuestionWithUnit = {
        ...mockQuestion,
        learning_sys: {
          id: 111,
          full_name: 'unit name keyword',
        } as any,
      };

      jest.spyOn(prisma.question, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.question, 'findMany').mockResolvedValue([mockQuestionWithUnit]);
      const dto: GetQuestionsDto = { onlyMine: false, page: 1, pageSize: 10, unitNameKeyword: 'keyword' };

      const result = await service.getQuestionForProblem(dto, 'user-uuid');

      expect(result).toEqual({
        questions: [mockQuestionWithUnit],
        totalPage: 1,
      });

      expect(prisma.question.count).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          learning_sys: {
            full_name: {
              contains: 'keyword',
            },
          },
        },
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          title: undefined,
          question_user_uuid: undefined,
          learning_sys: {
            full_name: {
              contains: 'keyword',
            },
          },
        },
        orderBy: { created_at: 'desc' },
        include: { problem_solving: true, problem: { select: { answer_type: true, latex_data: true, cls_id: true } } },
        skip: 0,
        take: 10,
      });
    });

    it('모든 조건이 주어졌을 때, 해당 조건에 맞는 질문을 반환해야 합니다.', async () => {
      const mockQuestionWithAllConditions = {
        ...mockQuestion,
        learning_sys: {
          id: 111,
          full_name: 'unit name keyword',
        } as any,
      };

      jest.spyOn(prisma.question, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.question, 'findMany').mockResolvedValue([mockQuestionWithAllConditions]);
      const dto: GetQuestionsDto = {
        onlyMine: true,
        page: 1,
        pageSize: 10,

        titleKeyword: 'title',
        unitNameKeyword: 'keyword',
      };

      const result = await service.getQuestionForProblem(dto, 'user-uuid');

      expect(result).toEqual({
        questions: [mockQuestionWithAllConditions],
        totalPage: 1,
      });

      expect(prisma.question.count).toHaveBeenCalledWith({
        where: {
          question_user_uuid: 'user-uuid',
          deleted_at: null,
          title: { contains: 'title' },
          learning_sys: {
            full_name: {
              contains: 'keyword',
            },
          },
        },
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          question_user_uuid: 'user-uuid',
          deleted_at: null,
          title: { contains: 'title' },
          learning_sys: {
            full_name: {
              contains: 'keyword',
            },
          },
        },
        orderBy: { created_at: 'desc' },
        include: { problem_solving: true, problem: { select: { answer_type: true, latex_data: true, cls_id: true } } },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('createAnswerForQuestion', () => {
    it('질문이 존재하지 않으면 예외를 던져야 합니다.', async () => {
      jest.spyOn(prisma.question, 'findUnique').mockResolvedValue(null);

      await expect(service.createAnswerForQuestion(1, 'user-uuid', 'video_path', ProblemSolvingScope.ALL)).rejects.toThrow(
        new HttpException('질문을 찾을 수 없습니다.', 404),
      );
    });

    it('질문에 대한 답변을 생성해야 합니다.', async () => {
      const mockQuestion: question = {
        id: 1,
        problem_id: 1,
        question_user_uuid: 'user-uuid',
        learning_sys_id: 111,
        created_at: new Date(),
        title: 'title',
        deleted_at: null,
        problem_solving_id: null,
        solving_user_uuid: null,
        solving_video_id: null,
        status: QuestionStatus.IDLE,
      };

      jest.spyOn(prisma.question, 'findUnique').mockResolvedValue(mockQuestion);
      const createSpy = jest.spyOn(prisma.problem_solving, 'create').mockResolvedValue({
        id: 1,
      } as any);

      await service.createAnswerForQuestion(1, 'user-uuid', 'video_path', ProblemSolvingScope.ALL);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          video_path: 'video_path',
          scope: ProblemSolvingScope.ALL,
          problem_id: mockQuestion.problem_id,
          user_uuid: 'user-uuid',
          question: {
            connect: { id: mockQuestion.id, status: QuestionStatus.QUESTION },
          },
          status: ProblemSolvingStatus.IDLE,
        },
        select: {
          id: true,
        },
      });
    });
  });

  describe('getQnAsByUuids', () => {
    it('주어진 UUID 목록에 해당하는 질문을 반환해야 합니다.', async () => {
      const mockQuestions: question[] = [
        {
          id: 1,
          problem_id: 1,
          question_user_uuid: 'user-uuid-1',
          learning_sys_id: 111,
          created_at: new Date(),
          title: 'title1',
          deleted_at: null,
          problem_solving_id: null,
          solving_user_uuid: null,
          solving_video_id: null,
          status: QuestionStatus.IDLE,
        },
        {
          id: 2,
          problem_id: 2,
          question_user_uuid: 'user-uuid-2',
          learning_sys_id: 222,
          created_at: new Date(),
          title: 'title2',
          deleted_at: null,
          problem_solving_id: null,
          solving_user_uuid: null,
          solving_video_id: null,
          status: QuestionStatus.IDLE,
        },
      ];

      jest.spyOn(prisma.question, 'findMany').mockResolvedValue(mockQuestions);

      const result = await service.getQnAsByUuids(['user-uuid-1', 'user-uuid-2']);

      expect(result).toEqual(mockQuestions);
    });
  });

  describe('getAnswerForQuestion', () => {
    it('질문이 존재하지 않으면 예외를 던져야 합니다.', async () => {
      const id = 1;
      const dto: GetQuestionAnswersDto = { page: 1, pageSize: 10, onlyMine: false };
      const uuid = 'user-uuid';

      prisma.question.findUnique.mockResolvedValue(null);

      await expect(service.getAnswerForQuestion(id, dto, uuid, classInfo)).rejects.toThrow(new HttpException('질문을 찾을 수 없습니다.', HttpStatus.NOT_FOUND));
    });

    it('질문에 대한 답변을 조회해야 합니다.', async () => {
      const id = 1;
      const dto: GetQuestionAnswersDto = { page: 1, pageSize: 10, onlyMine: false };
      const uuid = 'user-uuid';

      const mockQuestion: question = {
        id,
        problem_id: 1,
        question_user_uuid: 'user-uuid',
        learning_sys_id: 111,
        created_at: new Date(),
        title: 'title',
        deleted_at: null,
        problem_solving_id: null,
        solving_user_uuid: null,
        solving_video_id: null,
        status: QuestionStatus.IDLE,
      };

      const mockPinnedAnswers: problem_solving[] = [
        {
          id: 1,
          problem_id: 1,
          user_uuid: 'user-uuid',
          video_path: 'video_path',
          created_at: new Date(),
          scope: ProblemSolvingScope.ALL,
          status: ProblemSolvingStatus.IDLE,
          deleted_at: null,
          pinned: true,
        },
      ];

      const mockMyAnswers: problem_solving[] = [
        {
          id: 2,
          problem_id: 1,
          user_uuid: 'user-uuid',
          video_path: 'video_path',
          created_at: new Date(),
          scope: ProblemSolvingScope.ALL,
          status: ProblemSolvingStatus.IDLE,
          deleted_at: null,
          pinned: false,
        },
      ];

      prisma.question.findUnique.mockResolvedValue(mockQuestion);
      prisma.problem_solving.findMany
        .mockResolvedValueOnce(mockPinnedAnswers) // For pinned answers
        .mockResolvedValueOnce(mockMyAnswers) // For my answers
        .mockResolvedValueOnce([]); // For other answers if needed

      const result = await service.getAnswerForQuestion(id, dto, uuid, classInfo);

      expect(result).toEqual([...mockPinnedAnswers, ...mockMyAnswers]);
    });

    it('onlyMine 옵션이 true인 경우, 사용자 자신의 답변만 조회해야 합니다.', async () => {
      const id = 1;
      const dto: GetQuestionAnswersDto = { page: 1, pageSize: 10, onlyMine: true };
      const uuid = 'user-uuid';

      const mockQuestion: question = {
        id,
        problem_id: 1,
        question_user_uuid: 'user-uuid',
        learning_sys_id: 111,
        created_at: new Date(),
        title: 'title',
        deleted_at: null,
        problem_solving_id: null,
        solving_user_uuid: null,
        solving_video_id: null,
        status: QuestionStatus.IDLE,
      };

      const mockMyAnswers: problem_solving[] = [
        {
          id: 1,
          problem_id: 1,
          user_uuid: 'user-uuid',
          video_path: 'video_path',
          created_at: new Date(),
          scope: ProblemSolvingScope.ME,
          status: ProblemSolvingStatus.IDLE,
          deleted_at: null,
          pinned: false,
        },
      ];

      prisma.question.findUnique.mockResolvedValue(mockQuestion);
      prisma.problem_solving.findMany
        .mockResolvedValueOnce([]) // For pinned answers
        .mockResolvedValueOnce(mockMyAnswers) // For my answers
        .mockResolvedValueOnce([]); // For other answers if needed

      const result = await service.getAnswerForQuestion(id, dto, uuid, classInfo);

      expect(result).toEqual(mockMyAnswers);
    });

    it('클래스 정보에 따라 CLASS 범위의 답변을 조회해야 합니다.', async () => {
      const id = 1;
      const dto: GetQuestionAnswersDto = { page: 1, pageSize: 10, onlyMine: false };
      const uuid = 'user-uuid';

      const mockQuestion: question = {
        id,
        problem_id: 1,
        question_user_uuid: 'user-uuid',
        learning_sys_id: 111,
        created_at: new Date(),
        title: 'title',
        deleted_at: null,
        problem_solving_id: null,
        solving_user_uuid: null,
        solving_video_id: null,
        status: QuestionStatus.IDLE,
      };

      const mockPinnedAnswers: problem_solving[] = [];
      const mockMyAnswers: problem_solving[] = [];
      const mockClassAnswers: problem_solving[] = [
        {
          id: 1,
          problem_id: 1,
          user_uuid: 'another-user-uuid',
          video_path: 'video_path',
          created_at: new Date(),
          scope: ProblemSolvingScope.CLASS,
          status: ProblemSolvingStatus.IDLE,
          deleted_at: null,
          pinned: false,
        },
      ];

      prisma.question.findUnique.mockResolvedValue(mockQuestion);
      prisma.problem_solving.findMany
        .mockResolvedValueOnce(mockPinnedAnswers) // For pinned answers
        .mockResolvedValueOnce(mockMyAnswers) // For my answers
        .mockResolvedValueOnce(mockClassAnswers); // For other answers if needed

      const result = await service.getAnswerForQuestion(id, dto, uuid, classInfo);

      expect(result).toEqual([...mockPinnedAnswers, ...mockMyAnswers, ...mockClassAnswers]);
    });

    it('일반적인 오류를 처리해야 합니다.', async () => {
      const id = 1;
      const dto: GetQuestionAnswersDto = { page: 1, pageSize: 10, onlyMine: false };
      const uuid = 'user-uuid';

      prisma.question.findUnique.mockRejectedValue(new Error('Internal server error'));

      await expect(service.getAnswerForQuestion(id, dto, uuid, classInfo)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deleteAnswerForQuestion', () => {
    it('답변이 존재하지 않으면 예외를 던져야 합니다.', async () => {
      const id = 1;
      const uuid = 'user-uuid';

      prisma.problem_solving.findUnique.mockResolvedValue(null);

      await expect(service.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(new HttpException('답변을 찾을 수 없습니다.', HttpStatus.NOT_FOUND));
    });

    it('이미 삭제된 답변이면 예외를 던져야 합니다.', async () => {
      const id = 1;
      const uuid = 'user-uuid';
      const mockProblemSolving: problem_solving = {
        id,
        problem_id: 1,
        user_uuid: uuid,
        video_path: 'video_path',
        created_at: new Date(),
        scope: ProblemSolvingScope.ALL,
        status: ProblemSolvingStatus.IDLE,
        deleted_at: new Date(),
        pinned: false,
      };

      prisma.problem_solving.findUnique.mockResolvedValue(mockProblemSolving);

      await expect(service.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(new HttpException('이미 삭제된 답변입니다.', HttpStatus.CONFLICT));
    });

    it('작성자가 아닌 경우 예외를 던져야 합니다.', async () => {
      const id = 1;
      const uuid = 'user-uuid';
      const mockProblemSolving: problem_solving = {
        id,
        problem_id: 1,
        user_uuid: 'another-uuid',
        video_path: 'video_path',
        created_at: new Date(),
        scope: ProblemSolvingScope.ALL,
        status: ProblemSolvingStatus.IDLE,
        deleted_at: null,
        pinned: false,
      };

      prisma.problem_solving.findUnique.mockResolvedValue(mockProblemSolving);

      await expect(service.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(
        new HttpException('오직 작성자만이 답변을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN),
      );
    });

    it('답변을 삭제해야 합니다.', async () => {
      const id = 1;
      const uuid = 'user-uuid';
      const mockProblemSolving: problem_solving = {
        id,
        problem_id: 1,
        user_uuid: uuid,
        video_path: 'video_path',
        created_at: new Date(),
        scope: ProblemSolvingScope.ALL,
        status: ProblemSolvingStatus.IDLE,
        deleted_at: null,
        pinned: false,
      };

      prisma.problem_solving.findUnique.mockResolvedValue(mockProblemSolving);
      const updateSpy = prisma.problem_solving.update.mockResolvedValue({
        ...mockProblemSolving,
        deleted_at: new Date(),
      });

      await service.deleteAnswerForQuestion(id, uuid);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: id },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });
});
