/* eslint-disable sonarjs/no-duplicate-string */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SchoolClassHeader, classInfoHeaderDesc } from 'src/libs/decorators/school-class-header.decorator';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { Role } from 'src/libs/decorators/role.enum';
import { EDifficulty } from '../../problem';
import { AssessmentService } from '../application';
import {
  AssessmentDoneDto,
  AssessmentResultTableRowDto,
  CreateAssessmentPerformDto,
  CreateAssessmentPerformResponseDto,
  CreateComprehensiveAssessmentDto,
  CreateDiagnosticAssessmentDto,
  CreateUnitAssessmentDto,
  GenerateResultTableDto,
  GetAssessmentResultDto,
  GetDiagnosticAssessmentDto,
  GetDiagnosticAssessmentResponseDto,
  GetUnitAssessmentDto,
  UpdateAnswerOfAssessmentPerformDto,
  UpdateAnswerOfAssessmentPerformResponseDto,
} from '../application/dto';
import { Assessment, toEAssessmentType } from '../infrastructure/assessment.entity';
import { AssessmentProblem, toEAnswerType, toEProblemType } from '../infrastructure/assessmentProblem.entity';
import { AssessmentStatus } from '../infrastructure/assessmentStatus.entity';
import { RoleHeader } from 'src/libs/decorators/roleHeader.decorator';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('assessment')
@Controller({ path: 'assessment', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @ApiOperation({
    summary: '학생이 시험 문제 푼 것을 제출.',
    description: '학생이 시험 때 풀은 여러개의 문제를 하나의 배열에 담아서 한번에 제출합니다.',
  })
  @ApiOkResponse({
    description: `\n
    답안 제출이 성공하였는지 여부를 반환합니다.\n
    updatedIds : 답안이 업데이트 된 문제들의 id를 반환합니다.`,
    schema: {
      example: {
        updatedIds: [1, 2, 3],
      },
    },
  })
  @Post('submit-performs')
  async submitAnswersToAssessmentPerform(
    @Body() dto: UpdateAnswerOfAssessmentPerformDto,
    @UUIDHeader() uuid: string,
  ): Promise<UpdateAnswerOfAssessmentPerformResponseDto> {
    return await this.assessmentService.updateAnswerOfAssessmentPerform(dto, uuid);
  }

  @ApiOperation({
    summary: '학생이 시험 문제를 최초로 띄웠을 때 solving_start 시각을 기록합니다.',
    description: '프론트에서 학생이 띄운 시험 문제 번호와 uuid를 받아서 최초로 assessment_perform 테이블에 기록합니다.',
  })
  @ApiCreatedResponse({
    description: `\n
      최초로 문제를 띄운 시각을 기록한 assessment_perform의 id를 반환합니다.\n
      만약 이미 해당 문제를 띄워서 기록이 되어 있다면 already_created를 true로 반환하고, 이전에 기록된 id를 반환합니다.`,
    schema: {
      example: {
        success: true,
        assessment_perform_id: 1,
        already_created: false,
      },
    },
  })
  @Post('create-perform')
  async createAssessmentPerform(@Body() dto: CreateAssessmentPerformDto, @UUIDHeader() uuid: string): Promise<CreateAssessmentPerformResponseDto> {
    return await this.assessmentService.createAssessmentPerform(dto, uuid);
  }

  @ApiOperation({
    summary: '선생님이 시험 결과를 확인할 수 있는 테이블을 반환합니다.',
  })
  @ApiOkResponse({
    description: '시험 결과를 확인하는 테이블의 각 행을 Array로 반환하며, 각 Array에는 user_uuid, correction_rate, assessment_problems 정보가 담겨있습니다.',
    schema: {
      example: {
        results: [
          {
            user_uuid: 'uuid',
            correction_rate: 50,
            assessment_problems: [
              {
                assessment_perform_id: 1,
                assessment_problem_id: 1,
                problem_id: 1,
                is_correct: true,
                confidence: 1,
                difficulty: 'LOW',
              },
            ],
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Roles([Role.Teacher])
  @Get('result-table')
  async generateResultTable(@Query() dto: GenerateResultTableDto, @UUIDHeader() uuid: string): Promise<Array<AssessmentResultTableRowDto>> {
    return await this.assessmentService.generateResultTable(dto, uuid);
  }

  @ApiOperation({
    summary: '진단평가,형성평가,총괄평가를 출제하는 API입니다. 작업자: 강현길, 왕정희',
    description: `진단평가,형성평가,총괄평가를 출제하는 API입니다. 원래 진단평가만 출제했는데 형성평가, 총괄평가도 같은 API로 출제하기로 했습니다.\n
    오직 교사만 접근할 수 있는 API입니다.`,
  })
  @Post('diagnostic')
  @Roles([Role.Teacher])
  @ApiHeader(classInfoHeaderDesc)
  async createDiagnosisAssessment(@Body() dto: CreateDiagnosticAssessmentDto, @SchoolClassHeader() classInfo: ClassInfo): Promise<Assessment> {
    const result = await this.assessmentService.createAssessment(dto, classInfo);
    return {
      id: result.id,
      begunAt: result.begun_at ?? undefined,
      createdAt: result.created_at,
      type: toEAssessmentType(result.type),
      endAt: result.duration_in_second === null ? undefined : new Date(result.created_at.getTime() + result.duration_in_second * 1000),
    };
  }

  @ApiHeader(classInfoHeaderDesc)
  @Get('diagnostic/:id/problems')
  @ApiOperation({ summary: '진단평가별 문제를 조회하는 API입니다. 작업자: 강현길' })
  async getDiagnosticAssessmentProblems(@Param('id') id: number, @SchoolClassHeader() classInfo: ClassInfo): Promise<AssessmentProblem[]> {
    return await this.assessmentService.getAssessmentProblems(id, classInfo);
  }

  @ApiOperation({
    summary: '해당 학급, 학기에 출제된 진단평가를 조회하는 API입니다. 작성자: 강현길',
    description: `해당 학급, 학기에 출제된 진단평가를 조회하는 API입니다.\n
    평가에 대한 미리보기(교사용)와 전반적인 정보만 조회할 수 있습니다. 문제 조회는 문제 조회 API를 사용해주세요.`,
  })
  @Get('diagnostic')
  @Roles([Role.Teacher, Role.Student])
  @ApiHeader(classInfoHeaderDesc)
  @ApiOkResponse({
    type: GetDiagnosticAssessmentResponseDto,
  })
  async getDiagnosticAssessment(
    @Query() dto: GetDiagnosticAssessmentDto,
    @UUIDHeader() uuid: string,
    @RoleHeader() role: Role,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<GetDiagnosticAssessmentResponseDto | null> {
    const result = await this.assessmentService.getDiagnosticAssessment(dto, role, classInfo, uuid);
    if (result === null) return null;
    return {
      assessment: {
        perfomStatus: result.status!,
        createdAt: result.assessment.created_at,
        id: result.assessment.id,
        type: toEAssessmentType(result.assessment.type),
        begunAt: result.assessment.begun_at ?? undefined,
        endAt: result.assessment.begun_at ? new Date(result.assessment.begun_at.getTime() + result.assessment.duration_in_second! * 1000) : undefined,
      },
      problems: result?.assessment.assessment_problem?.map((assessment_problem): AssessmentProblem => {
        return {
          id: assessment_problem.id,
          aiHint: assessment_problem.problem.ai_hint ?? undefined,
          answerType: toEAnswerType(assessment_problem.problem.answer_type),
          problemType: toEProblemType(assessment_problem.problem.type),
          createdAt: assessment_problem.problem.created_at,
          explanation: assessment_problem.problem.explanation ?? undefined,
          solutionDetail: assessment_problem.problem.detail_solution ?? undefined,
          correctAnswer: assessment_problem.problem.answer_data,
          difficulty: EDifficulty.getFromPrisma(assessment_problem.problem.difficulty),
          curriculumId: assessment_problem.problem.cls_id,
          originalProblemId: assessment_problem.problem.id,
          latexData: assessment_problem.problem.latex_data,
        };
      }),
    };
  }

  @ApiOperation({
    summary: '예약된 진단평가를 지금 바로 시작하는 API입니다. 시작 시간을 반환합니다. 작업자: 강현길',
    description: '이미 시작했거나 종료된 시험에 대해서는 동작하지 않습니다.',
  })
  @Patch('diagnostic/:id')
  @Roles([Role.Teacher])
  @ApiHeader(classInfoHeaderDesc)
  async startDiagnosticNow(@Param('id') id: number, @SchoolClassHeader() classInfo: ClassInfo): Promise<Date> {
    return (await this.assessmentService.startDiagnosticNow(id, classInfo)).begun_at!;
  }

  @ApiOperation({
    summary: '대단원 학습이 끝나고 치르는 형성평가를 출제하는 API입니다. 작업자: 강현길',
    description: `대단원 학습이 끝나고 치르는 형성평가를 출제하는 API입니다.
    오직 교사만 접근할 수 있는 API입니다.`,
  })
  @Roles([Role.Teacher])
  @Post('unit')
  @ApiHeader(classInfoHeaderDesc)
  async createUnitAssessment(@Body() dto: CreateUnitAssessmentDto, @SchoolClassHeader() classInfo: ClassInfo): Promise<Assessment> {
    const result = await this.assessmentService.createUnitAssessment(dto, classInfo);
    return {
      id: result.id,
      begunAt: result.begun_at ?? undefined,
      createdAt: result.created_at,
      type: toEAssessmentType(result.type),
      endAt: result.duration_in_second === null ? undefined : new Date(result.created_at.getTime() + result.duration_in_second * 1000),
    };
  }

  @ApiOperation({
    summary: '해당 학급, 해당 대단원에 대응하는 형성평가를 조회하는 API입니다. 작업자: 강현길',
    description: `해당 학급, 해당 대단원에 대응하는 형성평가를 조회하는 API입니다.\n
    평가에 대한 전반적인 정보만 조회할 수 있습니다. 문제 조회는 문제 조회 API를 사용해주세요.`,
  })
  @Roles([Role.Teacher, Role.Student])
  @Get('unit')
  @ApiHeader(classInfoHeaderDesc)
  @ApiOkResponse({
    type: Assessment,
  })
  async getUnitAssessment(
    @Query() dto: GetUnitAssessmentDto,
    @SchoolClassHeader() classInfo: ClassInfo,
    @RoleHeader() role: Role,
    @UUIDHeader() uuid: string,
  ): Promise<Assessment | null> {
    const result = await this.assessmentService.getUnitAssessment(dto, classInfo, role, uuid);
    if (result === null) return null;
    return {
      id: result.assessment.id,
      begunAt: result.assessment.begun_at ?? undefined,
      createdAt: result.assessment.created_at,
      type: toEAssessmentType(result.assessment.type),
      endAt:
        result.assessment.duration_in_second === null
          ? undefined
          : new Date(result.assessment.created_at.getTime() + result.assessment.duration_in_second * 1000),
      perfomStatus: result.status!,
    };
  }
  @ApiOperation({ summary: '형성평가의 문제를 조회하는 API입니다. 작업자: 강현길' })
  @Get('unit/:id/problems')
  @ApiHeader(classInfoHeaderDesc)
  async getUnitAssessmentProblems(id: number, @SchoolClassHeader() classInfo: ClassInfo): Promise<AssessmentProblem[]> {
    return await this.assessmentService.getAssessmentProblems(id, classInfo);
  }

  @ApiOperation({
    summary: '학기가 끝나고 치르는 총괄평가를 출제하는 API입니다. 작업자: 강현길',
    description: `학기가 끝나고 치르는 총괄평가를 출제하는 API입니다.
    오직 교사만 접근할 수 있는 API입니다.`,
  })
  @Roles([Role.Teacher])
  @Post('comprehensive')
  @ApiHeader(classInfoHeaderDesc)
  async createComprehensiveAssessment(@Body() dto: CreateComprehensiveAssessmentDto, @SchoolClassHeader() classInfo: ClassInfo): Promise<Assessment> {
    const result = await this.assessmentService.createComprehensiveAssessment(dto, classInfo);

    return {
      id: result.id,
      begunAt: result.begun_at ?? undefined,
      createdAt: result.created_at,
      type: toEAssessmentType(result.type),
      endAt: result.duration_in_second === null ? undefined : new Date(result.created_at.getTime() + result.duration_in_second * 1000),
    };
  }

  @ApiOperation({
    summary: '해당 학급, 해당 대단원에 대응하는 총괄평가를 조회하는 API입니다. 작업자: 강현길',
    description: `해당 학급, 해당 대단원에 대응하는 총괄평가를 조회하는 API입니다.\n
    평가에 대한 전반적인 정보만 조회할 수 있습니다. 문제 조회는 문제 조회 API를 사용해주세요.`,
  })
  @ApiOkResponse({
    type: Assessment,
  })
  @Roles([Role.Teacher, Role.Student])
  @Get('comprehensive')
  @ApiHeader(classInfoHeaderDesc)
  async getComprehensiveAssessment(
    @SchoolClassHeader() classInfo: ClassInfo,
    @RoleHeader() role: Role,
    @UUIDHeader() uuid: string,
  ): Promise<Assessment | null> {
    const result = await this.assessmentService.getComprehensiveAssessment(classInfo, role, uuid);

    return result === null
      ? null
      : {
          id: result.assessment.id,
          begunAt: result.assessment.begun_at ?? undefined,
          createdAt: result.assessment.created_at,
          type: toEAssessmentType(result.assessment.type),
          endAt:
            result.assessment.duration_in_second === null
              ? undefined
              : new Date(result.assessment.created_at.getTime() + result.assessment.duration_in_second * 1000),
          perfomStatus: result.status!,
        };
  }

  @ApiOperation({ summary: '총괄평가의 문제를 조회하는 API입니다. 작업자: 강현길' })
  @Get('comprehensive/:id/problems')
  @ApiHeader(classInfoHeaderDesc)
  async getComprehensiveAssessmentProblems(id: number, @SchoolClassHeader() classInfo: ClassInfo): Promise<AssessmentProblem[]> {
    return await this.assessmentService.getAssessmentProblems(id, classInfo);
  }

  @ApiOperation({ summary: '자기 학급에 출제되어서 시작하기 전이거나 이미 진행 중인 시험이 있는지 없는지를 확인해보는 API입니다. 작업자: 강현길' })
  @Get('status')
  @ApiHeader(classInfoHeaderDesc)
  @ApiOkResponse({ type: AssessmentStatus, isArray: true })
  async getAssessmentStatus(@SchoolClassHeader() classInfo: ClassInfo): Promise<AssessmentStatus[]> {
    return await this.assessmentService.getAssessmentStatus(classInfo);
  }

  @ApiOperation({
    summary: '평가를 모두 제출한 뒤, 결과 페이지에 진입할 때 각종 정보를 받아옵니다. 작업자: 왕정희(24.07.02)',
  })
  @Get('done')
  @ApiHeader(classInfoHeaderDesc)
  @ApiOkResponse({
    description: `\n
    나의 점수, 반평균, 나의 학습 단계, 채점 결과를 각각 반환합니다.\n
    `,
    schema: {
      example: {
        score: 80,
        averageScore: 75,
        achievementLevel: 8,
        problems: '문제 리스트',
      },
    },
  })
  async getAssessmentResult(@Query() dto: GetAssessmentResultDto, @UUIDHeader() uuid: string): Promise<AssessmentDoneDto> {
    return await this.assessmentService.getAssessmentResult(dto, uuid);
  }

  @ApiOperation({
    summary: '',
  })
  @Get('assessment-exist')
  @ApiHeader(classInfoHeaderDesc)
  async checkAssessmentExist(@SchoolClassHeader() classInfo: ClassInfo) {
    return await this.assessmentService.checkAssessmentStatus(classInfo);
  }
}
