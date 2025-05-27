/* eslint-disable sonarjs/no-duplicate-string */
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionController } from './question.controller';
import { QuestionService } from '../application/question.service';
import { CreateQuestionDto } from '../application/dto/create-question.dto';
import { GetQuestionsDto } from '../application/dto/getQuestions.dto';
import { CreateAnswerDto } from '../../study/submodules/shared-solution-video/application/dto/create-answer.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AnswerType, ProblemSolvingScope, ProblemSolvingStatus, QuestionStatus } from '@prisma/client';
import { WinstonModule } from 'nest-winston';
import { GetQuestionAnswersDto } from '../application/dto';
import { EProblemSolvingScope } from '../../study';
import { EProblemSolvingStatus } from '../../problem';
import { ClassInfo } from 'src/libs/dto/class-info.dto';

describe('QuestionController', () => {
  let controller: QuestionController;
  let service: DeepMockProxy<QuestionService>;
  const classInfo: ClassInfo = { school_id: 'school-id', user_class: 'class-id', user_grade: 'grade-id', semester: 1 }; // Adjust the classInfo according to the actual type definition

  beforeEach(async () => {
    service = mockDeep<QuestionService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionController],
      providers: [
        {
          provide: QuestionService,
          useValue: service,
        },
      ],
      imports: [WinstonModule.forRoot({})],
    }).compile();

    controller = module.get<QuestionController>(QuestionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('문제에 대한 질문 생성', () => {
    it('문제에 대한 질문을 생성해야 합니다', async () => {
      const dto: Partial<CreateQuestionDto> = { problemId: 1, title: 'Question Title' };
      const uuid = 'user-uuid';
      const createdQuestion = { id: 1 };

      service.putQuestionForProblem.mockResolvedValue(createdQuestion as any);

      const result = await controller.createQuestionForProblem(dto as CreateQuestionDto, uuid);

      expect(result).toEqual({ id: 1 });
      expect(service.putQuestionForProblem).toHaveBeenCalledWith(dto.problemId, uuid, dto.title);
    });

    it('HttpException을 처리해야 합니다', async () => {
      const dto: Partial<CreateQuestionDto> = { problemId: 1, title: 'Question Title' };
      const uuid = 'user-uuid';

      service.putQuestionForProblem.mockRejectedValue(new HttpException('Error', HttpStatus.BAD_REQUEST));

      await expect(controller.createQuestionForProblem(dto as CreateQuestionDto, uuid)).rejects.toThrow(new HttpException('Error', HttpStatus.BAD_REQUEST));
    });

    it('일반적인 오류를 처리해야 합니다', async () => {
      const dto: Partial<CreateQuestionDto> = { problemId: 1, title: 'Question Title' };
      const uuid = 'user-uuid';

      service.putQuestionForProblem.mockRejectedValue(new Error('Error'));

      await expect(controller.createQuestionForProblem(dto as CreateQuestionDto, uuid)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('문제에 대한 질문 조회', () => {
    it('문제에 대한 질문을 조회해야 합니다', async () => {
      const dto: Partial<GetQuestionsDto> = { pageSize: 1, page: 1 };
      const uuid = 'user-uuid';
      const mockQuestion = {
        id: 1,
        problem_id: 1,
        question_user_uuid: uuid,
        solving_user_uuid: null,
        created_at: new Date(),
        title: 'Question Title',
        status: QuestionStatus.IDLE,
        solving_video_id: 1,
        deleted_at: null,
        problem_solving_id: 1,
        problem_solving: {
          id: 1,
          problem_id: 1,
          created_at: new Date(),
          status: ProblemSolvingStatus.IDLE,
          scope: ProblemSolvingScope.ALL,
          user_uuid: 'solving-uuid',
          video_path: 'video_path',
          deleted_at: null,
          pinned: false,
        },
        problem: {
          cls_id: 'cls_id',
          latex_data: 'latex_data',
          answer_type: AnswerType.SELECT,
        },
        learning_sys_id: 111,
      };

      service.getQuestionForProblem.mockResolvedValue({
        questions: [mockQuestion],
        totalPage: 1,
      });

      const result = await controller.getQuestions(dto as GetQuestionsDto, uuid);

      expect(result).toEqual({
        totalPage: 1,
        questions: [
          {
            id: mockQuestion.id,
            title: mockQuestion.title,
            problemId: mockQuestion.problem_id,
            questionUserUuid: mockQuestion.question_user_uuid,
            solvingUserUuid: mockQuestion.solving_user_uuid,
            createdAt: mockQuestion.created_at,
            curriculumId: mockQuestion.problem.cls_id,
            problemSolving: {
              id: mockQuestion.problem_solving.id,
              problemId: mockQuestion.problem_solving.problem_id,
              createdAt: mockQuestion.problem_solving.created_at,
              status: mockQuestion.problem_solving.status,
              scope: mockQuestion.problem_solving.scope,
              userUuid: mockQuestion.problem_solving.user_uuid,
              videoPath: mockQuestion.problem_solving.video_path,
            },
            learningSysId: mockQuestion.learning_sys_id,
            problemType: mockQuestion.problem.answer_type,
            latexData: mockQuestion.problem.latex_data,
          },
        ],
      });
    });

    it('HttpException을 처리해야 합니다', async () => {
      const dto: Partial<GetQuestionsDto> = { page: 1, pageSize: 1 };
      const uuid = 'user-uuid';

      service.getQuestionForProblem.mockRejectedValue(new HttpException('Error', HttpStatus.BAD_REQUEST));

      await expect(controller.getQuestions(dto as GetQuestionsDto, uuid)).rejects.toThrow(new HttpException('Error', HttpStatus.BAD_REQUEST));
    });

    it('일반적인 오류를 처리해야 합니다', async () => {
      const dto: Partial<GetQuestionsDto> = { page: 1, pageSize: 1 };
      const uuid = 'user-uuid';

      service.getQuestionForProblem.mockRejectedValue(new Error('Error'));

      await expect(controller.getQuestions(dto as GetQuestionsDto, uuid)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('질문에 대한 답변 생성', () => {
    it('질문에 대한 답변을 생성해야 합니다', async () => {
      const dto: Partial<CreateAnswerDto> = { questionId: 1, videoPath: 'video_path', scope: ProblemSolvingScope.ALL };
      const uuid = 'user-uuid';
      const createdAnswer = { id: 1 };

      service.createAnswerForQuestion.mockResolvedValue(createdAnswer as any);

      const result = await controller.putAnswerForQuestion(dto as CreateAnswerDto, uuid);

      expect(result).toEqual(createdAnswer);
      expect(service.createAnswerForQuestion).toHaveBeenCalledWith(dto.questionId, uuid, dto.videoPath, dto.scope);
    });

    it('HttpException을 처리해야 합니다', async () => {
      const dto: Partial<CreateAnswerDto> = { questionId: 1, videoPath: 'video_path', scope: ProblemSolvingScope.ALL };
      const uuid = 'user-uuid';

      service.createAnswerForQuestion.mockRejectedValue(new HttpException('Error', HttpStatus.BAD_REQUEST));

      await expect(controller.putAnswerForQuestion(dto as CreateAnswerDto, uuid)).rejects.toThrow(new HttpException('Error', HttpStatus.BAD_REQUEST));
    });

    it('일반적인 오류를 처리해야 합니다', async () => {
      const dto: Partial<CreateAnswerDto> = { questionId: 1, videoPath: 'video_path', scope: ProblemSolvingScope.ALL };
      const uuid = 'user-uuid';

      service.createAnswerForQuestion.mockRejectedValue(new Error('Error'));

      await expect(controller.putAnswerForQuestion(dto as CreateAnswerDto, uuid)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('질문에 대한 답변 조회', () => {
    it('질문에 대한 답변을 조회해야 합니다', async () => {
      const id = 1;
      const dto: Partial<GetQuestionAnswersDto> = { page: 1, pageSize: 10 };
      const uuid = 'user-uuid';
      const mockAnswers = [
        {
          id: 1,
          problem_id: 1,
          created_at: new Date(),
          video_path: 'video_path',
          scope: ProblemSolvingScope.ALL,
          user_uuid: 'user-uuid',
          status: ProblemSolvingStatus.IDLE,
          pinned: false,
          deleted_at: null,
        },
      ];

      service.getAnswerForQuestion.mockResolvedValue(mockAnswers);

      const result = await controller.getAnswerForQuestion(id, dto as GetQuestionAnswersDto, uuid, classInfo);

      expect(result).toEqual({
        page: dto.page,
        pageSize: mockAnswers.length,
        answers: mockAnswers.map((v) => ({
          createdAt: v.created_at,
          id: v.id,
          problemId: v.problem_id,
          scope: v.scope as EProblemSolvingScope,
          videoPath: v.video_path!,
          userUuid: v.user_uuid,
          status: v.status as EProblemSolvingStatus,
        })),
      });
      expect(service.getAnswerForQuestion).toHaveBeenCalledWith(id, dto, uuid, classInfo);
    });

    it('HttpException을 처리해야 합니다', async () => {
      const id = 1;
      const dto: Partial<GetQuestionAnswersDto> = { page: 1, pageSize: 10 };
      const uuid = 'user-uuid';
      service.getAnswerForQuestion.mockRejectedValue(new HttpException('Error', HttpStatus.BAD_REQUEST));

      await expect(controller.getAnswerForQuestion(id, dto as GetQuestionAnswersDto, uuid, classInfo)).rejects.toThrow(
        new HttpException('Error', HttpStatus.BAD_REQUEST),
      );
    });

    it('일반적인 오류를 처리해야 합니다', async () => {
      const id = 1;
      const dto: Partial<GetQuestionAnswersDto> = { page: 1, pageSize: 10 };
      const uuid = 'user-uuid';

      service.getAnswerForQuestion.mockRejectedValue(new Error('Internal Server Error'));

      await expect(controller.getAnswerForQuestion(id, dto as GetQuestionAnswersDto, uuid, classInfo)).rejects.toThrow(
        new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deleteAnswerForQuestion', () => {
    it('답변을 삭제해야 합니다', async () => {
      const id = 1;
      const uuid = 'user-uuid';

      service.deleteAnswerForQuestion.mockResolvedValue(undefined);

      await controller.deleteAnswerForQuestion(id, uuid);

      expect(service.deleteAnswerForQuestion).toHaveBeenCalledWith(id, uuid);
    });

    it('답변을 찾을 수 없으면 HttpException을 던져야 합니다', async () => {
      const id = 1;
      const uuid = 'user-uuid';

      service.deleteAnswerForQuestion.mockRejectedValue(new HttpException('답변을 찾을 수 없습니다.', HttpStatus.NOT_FOUND));

      await expect(controller.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(new HttpException('답변을 찾을 수 없습니다.', HttpStatus.NOT_FOUND));
    });

    it('이미 삭제된 답변이면 HttpException을 던져야 합니다', async () => {
      const id = 1;
      const uuid = 'user-uuid';

      service.deleteAnswerForQuestion.mockRejectedValue(new HttpException('이미 삭제된 답변입니다.', HttpStatus.CONFLICT));

      await expect(controller.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(new HttpException('이미 삭제된 답변입니다.', HttpStatus.CONFLICT));
    });

    it('작성자가 아닌 경우 HttpException을 던져야 합니다', async () => {
      const id = 1;
      const uuid = 'user-uuid';

      service.deleteAnswerForQuestion.mockRejectedValue(new HttpException('오직 작성자만이 답변을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN));

      await expect(controller.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(
        new HttpException('오직 작성자만이 답변을 삭제할 수 있습니다.', HttpStatus.FORBIDDEN),
      );
    });

    it('일반적인 오류를 처리해야 합니다', async () => {
      const id = 1;
      const uuid = 'user-uuid';

      service.deleteAnswerForQuestion.mockRejectedValue(new Error('Internal server error'));

      await expect(controller.deleteAnswerForQuestion(id, uuid)).rejects.toThrow(new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR));
    });
  });
});
