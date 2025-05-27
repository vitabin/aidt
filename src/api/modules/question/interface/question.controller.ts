import { Body, Controller, Get, Param, Patch, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common';

import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { QuestionService } from '../application/question.service';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { EProblemSolvingScope } from '../../study';
import { ProblemSolving } from '../../problem';
import { CreateAnswerResponseDto, CreateQuestionDto, GetQuestionsDto, QuestionResponseDto } from '../application/dto';
import { EAnswerType } from '../infrastructure/question.entity';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('question')
@Controller({ path: 'question', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class QuestionController {
  constructor(private readonly service: QuestionService) {}

  @ApiOperation({
    summary: `deprecated function
    문제에 대한 질문을 생성하는 API입니다.`,
    description: `문제에 대한 질문을 생성하는 API입니다.
    문제 id와 제목을 받아 질문을 생성합니다.
    해당 문제가 존재하지 않으면 예외를 던집니다. 작업자: 강현길`,
  })
  @Post()
  async createQuestionForProblem(@Body() dto: CreateQuestionDto, @UUIDHeader() uuid: string): Promise<CreateAnswerResponseDto> {
    const result = await this.service.putQuestionForProblem(dto, uuid);
    return { id: result.id };
  }

  @ApiOperation({
    summary: `deprecated function
    질문을 조회하는 API입니다.`,
    description: `질문을 조회하는 API입니다. 작업자: 강현길`,
  })
  @Get()
  async getQuestions(@Query() dto: GetQuestionsDto, @UUIDHeader() uuid: string): Promise<QuestionResponseDto> {
    const result = await this.service.getQuestionForProblem(dto, uuid);
    return {
      totalPage: result.totalPage ?? 0,
      answeredQuestionsCount: result.answeredQuestionsCount,
      awaitingQuestionsCount: result.awaitingQuestionsCount,
      questions: result.questions.map((question) => {
        return {
          id: question.id,
          title: question.title,
          problemId: question.problem.id,
          curriculumId: question.problem.cls_id,
          questionUserUuid: question.question_user_uuid,
          solvingUserUuid: question.shared_solution_video?.user_uuid,
          createdAt: question.created_at,
          problemSolving:
            question.shared_solution_video === null
              ? null
              : {
                  id: question.shared_solution_video.id,
                  problemId: question.problem_id,
                  createdAt: question.shared_solution_video.created_at,
                  scope: question.shared_solution_video.shared_solution_video_share!.scope as EProblemSolvingScope,
                  userUuid: question.shared_solution_video.user_uuid,
                  videoPath: question.shared_solution_video.video_path,
                },
          learningSysId: question.learning_sys_id,
          problemType: question.problem.answer_type as EAnswerType,
          latexData: question.problem.latex_data,
        };
      }),
    };
  }
  @ApiOperation({
    summary: `deprecated function
    질문에 대한 답변을 조회하는 API입니다. 작업자: 강현길`,
    description: '문제가 아닌 질문에 대한 답변을 조회하기 때문에 하나의 답변만 조회 가능합니다.',
  })
  @Get(':id/answer')
  async getAnswerForQuestion(@Param('questionId') id: number): Promise<ProblemSolving> {
    return await this.service.getAnswerForQuestion(id);
  }

  @ApiOperation({
    summary: `deprecated function
    답변을 올리기 전에 답변을 시작하는 API입니다. 작업자: 강현길`,
  })
  @Patch(':id')
  async startAnswerForQuestion(@Param('id') id: number, @UUIDHeader() uuid: string): Promise<void> {
    await this.service.startAnswerForQuestion(id, uuid);
  }
}
