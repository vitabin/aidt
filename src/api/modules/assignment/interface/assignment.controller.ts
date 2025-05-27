/* eslint-disable sonarjs/no-duplicate-string */
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  GetAssignmentGaveDto,
  AssignmentFinishDto,
  GetAssignmentProblemsResultDto,
  GetAssignmentDto,
  SubmitAssignmentDto,
  AssignmentExistDto,
  UnfinishedAssignmentDto,
  AssignmentCheckDto,
} from '../application/dto';
import { AssignmentService } from '../application/assignment.service';
import { assignment_finish, assignment_perform } from '@prisma/client';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { Role } from 'src/libs/decorators/role.enum';
import { GetExistAssignmentDto } from '../application/dto/getExistAssignment.dto';
import { ProblemDto } from '../../problem';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('assignment')
@Controller({ path: 'assignment', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @ApiOperation({
    summary: '학습 과제를 제출한다.',
    description: `학생이 선생님이 내준 학습 과제를 제출하는 API입니다.
    UUID는 헤더로 던져주세요.
    assignment_gave_id(PK,Int)와 finish_datetime(JS Date)를 받습니다.
    작업자 : 왕정희
    `,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/AssignmentFinishDto',
          },
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: '생성된 Assignment-finish 객체의 id를 반환합니다.',
    schema: {
      example: {
        id: 1,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('finish')
  async insertAssignmentFinish(@Body() assignmentFinishDto: AssignmentFinishDto, @UUIDHeader() uuid: string): Promise<assignment_finish[]> {
    return await this.assignmentService.insertAssignmentFinish(assignmentFinishDto, uuid);
  }

  @ApiOperation({
    summary: '참여학습 과제 출제',
    description: `
    현재 단원 ID, 과제 TYPE, 학급 전체 UUID, 문항의 배수, 교사 UUID를 파라미터로 받습니다.
    문항의 배수 * 틀린 문제 수 만큼의 과제가 출제됩니다.
    작업자: 최현빈_vitabin 24.06.25
    `,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: `과제가 출제된 학생 수와 학생 별 출제된 문제 수를 리턴합니다`,
    schema: {
      examples: [
        {
          type: 'type',
          createdUser: [
            {
              id: 'number',
              assignment_gave_id: 'number',
              user_uuid: 'string',
            },
          ],
        },
      ],
    },
  })
  @Roles([Role.Teacher])
  @Post('gave')
  async createAssignment(@Body() getAssignmentGaveDto: GetAssignmentGaveDto, @UUIDHeader() uuid: string) {
    return await this.assignmentService.createAssignment(getAssignmentGaveDto, uuid);
  }

  @ApiOperation({
    summary: '학생 과제 "결과보기 버튼"을 누르면 나오는 문제들을 보여줍니다.',
    description: `\n
    assignment_gave_id를 전달해주시면 해당 assignment 로 출제된 문제(problem)와,\n
    그 문제를 해당 uuid의 학생이 맞았는지, 틀렸는지 여부를 반환합니다.\n
    작업자: 왕정희 24.06.27, 구성모
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: `\n
      assignment_perform 객체 배열을 반환합니다.\n
      assignment_perform 객체 안에 problem 객체가 포함되어 있습니다.\n
      아래의 예시는 problem 객체의 일부 key-value만 적어두었는데, 실제로는 전체 problem 객체가 반환됩니다.\n
      `,
    schema: {
      examples: [
        {
          id: 1,
          assignment_gave_user_id: 1,
          problem_id: 1,
          status: 'SUBMIT',
          created_at: '2024-06-27 17:12:59',
          assignment_perform: {
            is_correct: 1,
            confidence: 1,
            created_at: '2024-06-27 17:12:59',
          },
          problem: {
            id: 1,
            difficulty: 'LOW',
            latex_data: 'test',
            answer_Data: '1',
            answer_type: 'select',
          },
        },
      ],
    },
  })
  @Get('problems-result')
  @Roles([Role.Student])
  async getAssignmentProblemsResult(@Query() dto: GetAssignmentProblemsResultDto, @UUIDHeader() uuid: string) {
    return await this.assignmentService.getAssignmentProblemsResult(dto.assignment_gave_id, uuid);
  }

  @ApiOperation({
    summary: '나의 과제 결과 조회',
    description: `
    학생의 uuid와 learningSysId를 query로 받습니다
    평가문제 결과조회와 같은 객체를 리턴합니다.
    과제를 제출하지 않았다면 iscorrect의 값은 null입니다.
    중단원 이상의 경우 하위 소단원들의 과제를 결과를 모두 리턴합니다.
    작업자: 최현빈_vitabin 24.06.27
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: {
      example: [
        {
          uuid: 'test',
          achievementLevel: 1,
          score: 70,
          results: [
            {
              problemId: 1,
              isCorrect: 1,
              difficulty: 'HIGH',
            },
            {
              problemId: 2,
              isCorrect: null,
              difficulty: 'HIGH',
            },
          ],
        },
      ],
    },
  })
  @Get('result')
  @Roles([Role.Student])
  async getAssignmentResultBoard(@UUIDHeader() uuid: string, @Query() getExistAssignment: GetExistAssignmentDto) {
    return await this.assignmentService.getAssignmentResultBoard(uuid, getExistAssignment);
  }

  @ApiOperation({
    summary: '과제 유무 조회',
    description: `
    과제 유무를 조회합니다.
    학생의 uuid를 Haeder로 받고 learningSysId를 query로 받습니다.
    `,
  })
  @ApiOkResponse({
    description: `
    유저의 uuid, 단원ID, 과제ID, 과제 Type argument를 가진 객체 배열을 리턴합니다.
    과제가 없다면 빈 객체를 리턴합니다.
    중단원 이상의 경우 하위 소단원들의 과제 여부를 모두 리턴합니다.
    작업자: 최현빈_vitabin (24.06.27)
    `,
    schema: {
      example: [
        {
          uuid: 'test',
          learningSysId: 1,
          assignmentId: 1,
          assignmentType: 'BASIC',
        },
        {
          uuid: 'test',
          learningSysId: 1,
          assignmentId: 2,
          assignmentType: 'METACOGNITION',
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('exist')
  async getAssignmentExist(
    @UUIDHeader() uuid: string,
    @Query() getExistAssignmentDto: GetExistAssignmentDto,
  ): Promise<AssignmentExistDto | AssignmentExistDto[]> {
    return await this.assignmentService.checkUserAssignment(uuid, getExistAssignmentDto);
  }

  @ApiOperation({
    summary: '유저에게 출제된 과제 문제 조회',
    description: `
    유저에게 출제된 과제 문제를 조회합니다.
    유저의 uuid를 header로 단원ID, 과제Type을 query로 받습니다
    과제의 풀이 내역이 있다면 함께 반환하고 없다면 null을 반환합니다.`,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '작업자: 최현빈_vitabin 24.06.27',
    schema: {
      example: [
        {
          problem_id: 1,
          cls_id: '가나다라',
          difficulty: 'HIGH',
          latex_data: '구하시오',
          ai_hint: 'string | null',
          assignment_id: 1,
          assignment_perform: {
            id: 1,
            assignment_problem_id: 1,
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
          assignment_id: 1,
          assignment_perform: null,
        },
      ],
    },
  })
  @Get('solve')
  async getAssignment(@UUIDHeader() uuid: string, @Query() getAssignmentDto: GetAssignmentDto): Promise<ProblemDto[]> {
    return await this.assignmentService.getAssignment(getAssignmentDto, uuid);
  }

  @ApiOperation({
    summary: '과제 문제 풀이 제출',
    description: `
    과제 ID, 과제 문제 ID, 유저풀이, 자신감을 body로 유저 uuid를 header로 받습니다.
    작업자: 최현빈_vitabin 24.06.28`,
  })
  @ApiCreatedResponse({
    description: `
    풀이 이력을 리턴합니다.`,
    schema: {
      example: {
        id: 1,
        assignment_problem_id: 1,
        is_correct: 1,
        confidence: 1,
        created_at: '2024-06-27 17:12:59',
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('submit')
  async submitAssignment(@Body() submitAssignmentDto: SubmitAssignmentDto, @UUIDHeader() uuid: string): Promise<assignment_perform> {
    return await this.assignmentService.submitAssignment(submitAssignmentDto, uuid);
  }

  @ApiOperation({
    summary: '과제 제출 여부 확인',
    description: `
    과제 제출 여부를 조회하는 API입니다.
    선생님 uuid를 header로, 단원ID: learningSysId, 학급 전체 uuid: classUuids를 query로 받습니다.
    작업자: 최현빈_vitabin 24.07.17`,
  })
  @ApiOkResponse({
    type: [UnfinishedAssignmentDto],
    description: `
    과제를 제출하지 않은 학생의 uuid와 과제 정보만 리턴합니다.
    학급 전체가 과제를 모두 제출하였다면 빈배열을 리턴합니다.
    `,
  })
  @Roles([Role.Teacher])
  @HttpCode(HttpStatus.OK)
  @Get('finish/check')
  async checkFinish(@UUIDHeader() teacherUuid: string, @Query() assignmentCheckDto: AssignmentCheckDto) {
    return await this.assignmentService.checkFinish(teacherUuid, assignmentCheckDto);
  }

  @ApiOperation({
    summary: '과제출제 가능 여부 조회',
    description: `
    과제 출제가 가능한지 여부를 조회합니다.
    출제 가능: true, 출제 불가능: false
    작업자: 최현빈_vitabin 24.07.22
    `,
  })
  @ApiOkResponse({ type: Boolean })
  @HttpCode(HttpStatus.OK)
  @Get('gave/check')
  async checkPossible(@UUIDHeader() uuid: string, @Query('learningSysId') learningSysId: string) {
    return this.assignmentService.checkGavePossible(uuid, parseInt(learningSysId));
  }
}
