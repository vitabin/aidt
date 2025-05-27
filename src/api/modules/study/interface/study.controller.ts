/* eslint-disable sonarjs/no-duplicate-string */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { GetQuestionBankDto, ProblemDto } from '../../problem';
import { StudyService } from '../application/study.service';
import {
  AnalysisTableRowDto,
  GenerateAnalysisTableDto,
  GetParticipationProblemDto,
  CreateReferenceDataDto,
  CreateReferenceDataResponseDto,
  GetReferenceDataDto,
  EditReferenceDataDto,
  CreateOrUpdateStudyChapterPlanDto,
  GetStudyChapterPlanDto,
  EditCommentForReferenceDataDto as EditCommentDto,
  GetCommentForReferenceDataDto,
  GetCommentsForReferenceDataResponseDto,
  StudyChapterPlanDto,
  GetSolutionOfProblemResponseDto,
  GetSolutionOfProblemDto,
  GetVideosOfProblemDto,
  GetVideosOfProblemResponseDto,
  GetCommentsOfVideoDto,
  GetCommentsOfVideoResponseDto,
} from '../application';
import { Role } from 'src/libs/decorators/role.enum';
import { StudyType, study_chapter_plan } from '@prisma/client';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { SchoolClassHeader, classInfoHeaderDesc } from 'src/libs/decorators/school-class-header.decorator';
import { GetReferenceDataResponseDto } from '../application/dto/getReferenceDataResponse.dto';
import { boolean } from 'zod';
import { CommentEntity, EProblemSolvingScope, ReferenceData } from '../infrastructure';
import { SubmitStudyDto } from '../application/dto/submitStudy.dto';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';

@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('study')
@Controller({ path: 'study', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @ApiOperation({
    summary: '보충/기초/유사/심화문제 조회',
    description: `개념학습 문제를 푼 후 해당 문제와 관련된 보충/기초/유사/심화문제를 조회합니다. 
    작업자: 최현빈_vitabin \n
    problemType:{
      보충문제: INFERIOR
      기초문제: BASIC
      유사문제: SIMILAR
      심화문제: ADVANCED
    }
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ProblemDto })
  @Get('question-bank')
  async getBankedQuestions(@Query() getQuestionBankDto: GetQuestionBankDto, @UUIDHeader() uuid: string): Promise<ProblemDto[]> {
    return await this.studyService.getBankedQuestions(getQuestionBankDto, uuid);
  }

  @ApiOperation({
    summary: '해당 소단원의 문제 분석표를 생성하여 반환하는 API입니다.',
    description: `\n
    불러오고자 하는 학생들의 UUID와 learning_sys_id를 배열로 보내주시면,\n
    해당 소단원의 문제 분석표를 생성하여 반환하는 API입니다.\n
    UUID로 group by 된 row들을 Array에 넣어 반환합니다.\n
    작업자 : 왕정희\n
    TODO: 진도율 계산 기능 추가 필요.`,
  })
  @ApiOkResponse({
    description: `\n해당 소단원의 문제 분석표 데이터를 Array로 반환합니다. \n
    각 Array에는 {user_uuid,correction_rate,progress_rate,problems}가 담겨있습니다.\n
    problems에는 {added,confidence,difficulty,is_correct,problem_id,study_perform_id,study_problem_id}가 담겨있습니다.\n
    프론트엔드에서는 problems 의 원소로 problem_id값을 전달해드리니 해당 값으로 문제 페이지로 연결시킬 수 있습니다.
    `,
    schema: {
      example: [
        {
          user_uuid: 'uuid',
          correction_rate: 50,
          progress_rate: 0,
          problems: [
            {
              added: 0,
              confidence: 0,
              difficulty: 'EASY',
              is_correct: 1,
              problem_id: 1,
              study_perform_id: 1,
              study_problem_id: 1,
            },
          ],
        },
      ],
    },
  })
  @ApiOperation({
    summary: '학습 도중 정답을 제출한 문제에 대한 해설을 조회하는 API입니다. 작업자: 강현길',
  })
  @Get('question-bank/solution')
  async getSolutionOfProblem(@Query() dto: GetSolutionOfProblemDto, @UUIDHeader() uuid: string): Promise<GetSolutionOfProblemResponseDto> {
    return await this.studyService.getSolutionOfProblem(dto, uuid);
  }
  @ApiOperation({
    summary: '학습 문제의 통합 개념 영상을 조회하는 API입니다. 작업자: 강현길 ',
  })
  @Get('question-bank/video')
  async getVideoOfProblem(@Query() dto: GetVideosOfProblemDto, @UUIDHeader() uuid: string): Promise<GetVideosOfProblemResponseDto> {
    return await this.studyService.getVideosOfProblem(dto, uuid);
  }

  @ApiOperation({
    summary: '학습 문제의 통합 개념 영상을 LIKE하는 API입니다. 작업자: 강현길',
    description: '업데이트 된 좋아요 개수를 반환합니다.',
  })
  @Patch('question-bank/video/:videoId/like')
  async updateLikeForVideo(@Param('videoId') videoId: number, @Body('like') like: boolean, @UUIDHeader() uuid: string): Promise<number> {
    return await this.studyService.updateLikeForVideo(videoId, uuid, like);
  }

  @ApiOperation({ summary: '통합 개념 영상의 댓글을 조회하는 API입니다. 작업자: 강현길' })
  @Get('question-bank/video/:videoId/comments')
  async getCommentsOfVideo(@Param('videoId') videoId: number, @Query() dto: GetCommentsOfVideoDto): Promise<GetCommentsOfVideoResponseDto> {
    return await this.studyService.getCommentsOfVideo(videoId, dto);
  }

  @ApiOperation({ summary: '통합 개념 영상의 댓글를 만드는 API입니다. 작업자: 강현길' })
  @Post('question-bank/video/:videoId/comments')
  async createCommentForVideo(@Param('videoId') videoId: number, @Body() dto: EditCommentDto, @UUIDHeader() uuid: string): Promise<CommentEntity> {
    return await this.studyService.createCommentForVideo(videoId, dto, uuid);
  }

  @ApiOperation({ summary: '통합 개념 영상의 댓글를 삭제하는 API입니다. 작업자: 강현길' })
  @Delete('question-bank/video/comments/:commentId')
  async deleteCommentForVideo(@Param('commentId') commentId: number, @UUIDHeader() uuid: string): Promise<void> {
    return await this.studyService.deleteCommentForVideo(commentId, uuid);
  }

  @ApiOperation({ summary: '통합 개념 영상의 댓글를 수정하는 API입니다. 작업자: 강현길' })
  @Patch('question-bank/video/comments/:commentId')
  async editCommentForVideo(@Param('commentId') commentId: number, @Body() dto: EditCommentDto, @UUIDHeader() uuid: string): Promise<CommentEntity> {
    return await this.studyService.editCommentForVideo(commentId, uuid, dto.comment);
  }
  @HttpCode(HttpStatus.OK)
  @Post('analysis-table')
  @Roles([Role.Teacher])
  async generateAnalysisTable(@Body() dto: GenerateAnalysisTableDto, @UUIDHeader() uuid: string): Promise<Array<AnalysisTableRowDto>> {
    if (!uuid) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    return await this.studyService.generateAnalysisTable(dto);
  }

  @ApiOperation({
    summary: '해당 개념(소단원)에 대응하는 참고자료를 등록하는 API입니다.',
    description: `해당 개념(소단원)에 대응하는 참고자료를 등록하는 API입니다.
    제목, 글 내용, 첨부 파일, 공유 범위를 설정하고 해당 소단원의 표준학습체계 ID를 보내주시면 됩니다.
    파일 업로드 관련 부분은 file 라우트를 참조바랍니다.`,
  })
  @Post('reference-data')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader(classInfoHeaderDesc)
  async createReferenceData(
    @Body() dto: CreateReferenceDataDto,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<CreateReferenceDataResponseDto> {
    return await this.studyService.createReferenceData(dto, uuid, classInfo);
  }

  @ApiOperation({
    summary: '해당 개념(소단원)에 대응하는 참고자료를 조회하는 API입니다.',
  })
  @Get('reference-data')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(classInfoHeaderDesc)
  async getReferenceData(
    @Query() getReferenceDataDto: GetReferenceDataDto,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<GetReferenceDataResponseDto> {
    return await this.studyService.getReferenceData(getReferenceDataDto, uuid, classInfo);
  }

  @ApiOperation({
    summary: '해당 개념(소단원)에 대응하는 참고자료를 상세조회하는 API입니다.',
  })
  @Get('reference-data/:id')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(classInfoHeaderDesc)
  async getReferenceDataDetail(@Param('id') id: number, uuid: string, @SchoolClassHeader() classInfo: ClassInfo): Promise<ReferenceData> {
    return await this.studyService.getReferenceDataDetail(id, uuid, classInfo);
  }

  @ApiOperation({ summary: '참고자료 조회수를 올리는 API입니다. 작업자: 강현길' })
  @Patch('reference-data/:id/view')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader(classInfoHeaderDesc)
  async viewReferenceData(
    @Param('id') referenceDataId: number,

    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ) {
    return await this.studyService.increaseViewCountForReferenceData(referenceDataId, uuid, classInfo);
  }
  @ApiOperation({ summary: '참고자료를 좋아요/좋아요해제 하는 API입니다. 작업자: 강현길' })
  @ApiBody({
    type: boolean,
    required: true,
    schema: {
      example: {
        like: true,
      },
    },
  })
  @Patch('reference-data/:id/like')
  @HttpCode(HttpStatus.ACCEPTED)
  async likeReferenceData(
    @Param('id') referenceDataId: number,
    @Body('like') like: boolean,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ) {
    return await this.studyService.likeReferenceData(referenceDataId, like, uuid, classInfo);
  }

  @ApiOperation({ summary: '참고자료를 삭제하는 API입니다. 작업자: 강현길' })
  @Delete('reference-data/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  async deleteReferenceData(@Param('id') id: number, @UUIDHeader() uuid: string) {
    return await this.studyService.deleteReferenceData(id, uuid);
  }

  @ApiOperation({ summary: '참고자료을 수정하는 API입니다. 작업자: 강현길' })
  @Patch('reference-data/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  async editReferenceData(@Body() dto: EditReferenceDataDto, @Param('id') id: number, @UUIDHeader() uuid: string): Promise<ReferenceData> {
    const result = await this.studyService.editReferenceData(dto, uuid, id);
    return {
      content: result.concept_reference_data!.content_data,
      createdAt: result.created_at,
      id: result.id,
      scope: result.scope as EProblemSolvingScope,
      title: result.concept_reference_data!.content_title,
      userUuid: result.uuid,
      viewCount: result.concept_reference_data!.view_count,
      filePaths: result.concept_reference_data!.concept_reference_file.map((v) => v.path),
      commentCount: result._count.concept_reference_comment ?? 0,
      likeCount: result.concept_reference_data?.like_count ?? 0,
      haveILiked: result.concept_reference_like.length > 0,
    };
  }

  @ApiOperation({ summary: '참고자료에 달린 댓글을 불러오는 API입니다. 작업자: 강현길' })
  @Get('reference-data/:id/comments')
  @ApiHeader(classInfoHeaderDesc)
  async getCommentForReferenceData(
    @Param('id') referenceDataId: number,
    dto: GetCommentForReferenceDataDto,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<GetCommentsForReferenceDataResponseDto> {
    const result = await this.studyService.getCommentForReferenceData(referenceDataId, classInfo, dto);

    return {
      comments: result.comments.map((comment) => {
        return {
          id: comment.id,
          content: comment.content,
          uuid: comment.user_uuid,
          createdAt: comment.created_at,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
        };
      }),
      currentPage: result.currentPage,
      totalPage: result.totalPage,
    };
  }

  @ApiOperation({ summary: '참고자료에 달린 댓글를 추가하는 API입니다. 작업자: 강현길' })
  @Post('reference-data/:id/comments')
  @ApiHeader(classInfoHeaderDesc)
  async createCommentForReferenceData(
    @Param('id') referenceDataId: number,
    @Body() dto: EditCommentDto,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ) {
    return await this.studyService.createCommentForReferenceData(referenceDataId, uuid, classInfo, dto.comment);
  }

  @ApiOperation({ summary: '참고자료에 달린 댓글를 삭제하는 API입니다. 작업자: 강현길' })
  @Delete('reference-data/comments/:id')
  @ApiHeader(classInfoHeaderDesc)
  async deleteCommentForReferenceData(@Param('id') commentId: number, @UUIDHeader() uuid: string) {
    return await this.studyService.deleteCommentForReferenceData(commentId, uuid);
  }

  @ApiOperation({ summary: '참고자료에 달린 댓글를 수정하는 API입니다. 작업자: 강현길' })
  @Patch('reference-data/comments/:id')
  @ApiHeader(classInfoHeaderDesc)
  async editCommentForReferenceData(@Param('id') commentId: number, @Body() dto: EditCommentDto, @UUIDHeader() uuid: string) {
    return await this.studyService.editCommentForReferenceData(commentId, uuid, dto.comment);
  }

  @ApiOperation({
    summary: '기본문제 조회',
    description: `기본문제를 조회합니다.
    해당 문제의 평균 정답률을과 문제객체를 반환합니다.
    풀이내역이 있으면 풀이내역을 함께 반환합니다.
    작업자: 최현빈_vitabin, 구성모`,
  })
  @ApiCreatedResponse({
    description: '',
    schema: {
      example: [
        {
          problem_id: 1,
          cls_id: '가나다라',
          difficulty: 'HIGH',
          latex_data: '구하시오',
          ai_hint: 'string | null',
          study_id: 1,
          study_perform: {
            id: 1,
            study_problem_id: 1,
            is_correct: 1,
            confidence: 1,
            created_at: '2024-06-27 17:12:59',
          },
        },
        {
          problem_id: 2,
          cls_id: '힘들다',
          difficulty: 'HIGH',
          latex_data: '구해주세요',
          ai_hint: 'string | null',
          study_id: 1,
          study_perform: null,
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('basic-search')
  async getBasicProblem(@Query() getParticipationProblemDto: GetParticipationProblemDto): Promise<ProblemDto[]> {
    return await this.studyService.getParticipationProblem(getParticipationProblemDto, StudyType.BASIC);
  }

  @ApiOperation({
    summary: '확인문제 조회',
    description: `확인를 조회합니다.
    해당 문제의 평균 정답률을과 문제객체를 반환합니다.
    풀이내역이 있으면 풀이내역을 함께 반환합니다
    작업자: 최현빈_vitabin, 구성모`,
  })
  @ApiCreatedResponse({
    description: '',
    schema: {
      example: [
        {
          problem_id: 1,
          cls_id: '가나다라',
          difficulty: 'HIGH',
          latex_data: '구하시오',
          ai_hint: 'string | null',
          study_id: 1,
          study_perform: {
            id: 1,
            study_problem_id: 1,
            is_correct: 1,
            confidence: 1,
            created_at: '2024-06-27 17:12:59',
          },
        },
        {
          problem_id: 2,
          cls_id: '힘들다',
          difficulty: 'HIGH',
          latex_data: '구해주세요',
          ai_hint: 'string | null',
          study_id: 1,
          study_perform: null,
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('confirm-search')
  async getConfirmProblem(@Query() getParticipationProblemDto: GetParticipationProblemDto): Promise<ProblemDto[]> {
    return await this.studyService.getParticipationProblem(getParticipationProblemDto, StudyType.CONFIRM);
  }

  @ApiOperation({
    summary: '피드백문제 조회',
    description: `피드백문제를 조회합니다.
    해당 문제의 평균 정답률을과 문제객체를 반환합니다.
    풀이내역이 있으면 풀이내역을 함께 반환합니다
    작업자: 최현빈_vitabin, 구성모`,
  })
  @ApiCreatedResponse({
    description: '',
    schema: {
      example: [
        {
          problem_id: 1,
          cls_id: '가나다라',
          difficulty: 'HIGH',
          latex_data: '구하시오',
          ai_hint: 'string | null',
          study_id: 1,
          study_perform: {
            id: 1,
            study_problem_id: 1,
            is_correct: 1,
            confidence: 1,
            created_at: '2024-06-27 17:12:59',
          },
        },
        {
          problem_id: 2,
          cls_id: '힘들다',
          difficulty: 'HIGH',
          latex_data: '구해주세요',
          ai_hint: 'string | null',
          study_id: 1,
          study_perform: null,
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('feedback-search')
  async getFeedbackProblem(@Query() getParticipationProblemDto: GetParticipationProblemDto): Promise<ProblemDto[]> {
    return await this.studyService.getParticipationProblem(getParticipationProblemDto, StudyType.FEEDBACK);
  }

  @ApiOperation({
    summary: '개념문제 제출',
    description: `
    유저 uuid를 header로 studyId, problemId, 유저의 정답, 유저의 자신감을 query로 받습니다.
    작업자: 최현빈_vitabin 24.06.28`,
  })
  @ApiCreatedResponse({
    description: '',
    schema: {
      example: [
        {
          id: 1,
          study_problem_id: 1,
          user_uuid: 'test',
          is_correct: 1,
          confidence: 1,
          ubmission_answer: '',
          solving_start: '2024-06-27 17:12:59',
          solving_end: '2024-06-27 17:14:59',
          created_at: '2024-06-27 17:12:59',
        },
      ],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('submit')
  async submitStudyPerform(@Body() submitStudyDto: SubmitStudyDto, @UUIDHeader() uuid: string) {
    return await this.studyService.submitStudyPerform(submitStudyDto, uuid);
  }

  @ApiOperation({
    summary: '학습 목표를 설정한다.',
    description: `학생이 소단원 화면에서 소단원별 학습 목표를 설정하는 버튼(1,2,3,...,10)을 클릭할 때 마다 호출해주시면 됩니다.
    최초 버튼 클릭시 progress_rate(진도율), achievement_level(학습단계), correct_rate(정답률), metarecognition_rate(메타인지)를 값을 모두 보내주셔야합니다.
    만약 서버에서 반환하는 값 중에 0이 있다면 해당 필드는 아직 유저가 입력하지 않은 값입니다.
    작업자 : 왕정희, 구성모, 최현빈
    마지막 수정일: 24.07.23_최현빈
    `,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/CreateOrUpdateStudyChapterPlanDto',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: `
    생성된 학습 목표 객체 하나를 반환합니다. 해당 값들로 학습목표를 업데이트 해주세요.
    중복이 감지 될 시 NotAcceptableException을 리턴합니다.`,
    schema: {
      example: {
        id: 1,
        semester_id: 1,
        uuid: 'EXAMPLE_UUID',
        learning_sys_id: 'nullable',
        progress_rate: 4,
        achievement_level: 7,
        correct_rate: 10,
        metarecognition_rate: 9,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Patch('study-chapter-plan')
  async createOrUpdateStudyChapterPlan(@Body() dto: CreateOrUpdateStudyChapterPlanDto, @UUIDHeader() uuid: string): Promise<study_chapter_plan> {
    return this.studyService.createOrUpdateStudyPlan(dto, uuid);
  }

  @ApiOperation({
    summary: '학습 목표를 조회한다.',
    description: `학생이 소단원 목차 화면에 진입할 때마다 호출해주시면 됩니다.
    만약 서버에서 id가 -1인 객체를 반환한다면 아직 유저가 학기별 학습 목표를 설정하지 않은 것입니다.
    만약 서버에서 learning_sys_id가 -1인 객체를 반환한다면 이전 소단원이 없는 것입니다.
    만약 서버에서 learning_sys_id가 null을 리턴한다면 희망노트의 "학기 학습목표"를 리턴한 것입니다.
    작업자 : 왕정희, 구성모, 최현빈
    마지막 수정일: 24.07.26_최현빈
    `,
  })
  @ApiOkResponse({
    description:
      '해당 UUID와 semester_id, learning_sys_id로 검색된 이전 학습 목표 객체와 현재 학습목표 객체를 반환합니다. 해당 값들로 희망 노트 화면을 업데이트 해주세요.',
    schema: {
      example: {
        current: {
          id: -1,
          semester_id: 0,
          learning_sys_id: 748,
          uuid: '2a4d4ea3-933e-5ef9-b6a7-b5dc8db31e8b',
          progress_rate: 0,
          achievement_level: 0,
          correct_rate: 0,
          metarecognition_rate: 0,
        },
        previous: {
          id: -1,
          semester_id: 0,
          learning_sys_id: -1,
          uuid: '2a4d4ea3-933e-5ef9-b6a7-b5dc8db31e8b',
          progress_rate: 0,
          achievement_level: 0,
          correct_rate: 0,
          metarecognition_rate: 0,
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('study-chapter-plan')
  async getStudyChapterPlan(@Query() dto: GetStudyChapterPlanDto, @UUIDHeader() uuid: string): Promise<StudyChapterPlanDto> {
    return this.studyService.getStudyPlan(dto, uuid);
  }

  @ApiOperation({
    summary: '추가된 문제와 study_problem 연동',
  })
  @Post('synchronize')
  async syncStudyProblemAndProblem() {
    return this.studyService.syncStudyProblemAndProblem();
  }
}
