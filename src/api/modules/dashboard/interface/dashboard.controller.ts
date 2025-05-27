/* eslint-disable sonarjs/no-duplicate-string */
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Query, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../application/dashboard.service';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import {
  AccumulateDto,
  AccumulatePerformDto,
  ResultBoardDto,
  AverageDataDto,
  GetAssessmentHistoryDto,
  GetAverageDataDto,
  GetDescendingIn2StudentsDto,
  GetDescendingIn2SubsectionsStudentsResponseDto,
  GetLearningHistoryDto,
  GetTeacherUserPlanNotesDto,
  GetTeacherWeakChaptersDto,
  LearningHistoryDto,
  StudentAchievementLevelDto,
  StudentProgressRateDto,
  StudentStudyDurationDto,
  StudentWeakChaptersDto,
  TeacherWeakChaptersDto,
  UserPlanNoteDto,
  GetLearningHistoryOfUserResponseDto,
  MvpDto,
  GetTeacherDashboardProblemsDto,
  GetTeacherDashboardConceptVideosDto,
  GetAchievementStandardUsersDto,
  studentAchievementStandardResponseDto,
} from '../application/dto';
import { Role } from 'src/libs/decorators/role.enum';
import { StatisticDto } from '../application/dto/statistic.dto';
import { GetAccumulateDto } from '../application/dto/getAccumulate.dto';
import { SchoolClassHeader } from 'src/libs/decorators/school-class-header.decorator';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { HistoryService } from 'src/history/history.service';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
import { GetAchievementStandardDto } from '../application/dto/getAchievementStandard.dto';
import { GetStudentWeakChaptersDto } from '../application/dto/getStudentWeakChapters.dto';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('dashboard')
@Controller({ path: 'dashboard', version: ['1'] })
@UseGuards(RolesGuard)
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly historyService: HistoryService,
  ) {}

  @ApiOperation({
    summary: '학생 대시보드 1번 누적 데이터 조회',
    description: `
  1번 대시보드에 해당하는 누적 데이터 조회입니다.
  uuids는 ","로 구분하여 요청해주세요.
  작업자: 최현빈_vitabin (2024.06.02)
  `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccumulateDto })
  @Get('accumulated-data')
  async getAccumulateData1Page(@Query() getAccumulateDto: GetAccumulateDto, @UUIDHeader() uuid: string): Promise<AccumulateDto> {
    return await this.dashboardService.getAccumulate1Page(getAccumulateDto, uuid);
  }

  @ApiOperation({
    summary: '학생 대시보드 2번 누적 데이터 조회',
    description: `
  2번 대시보드에 해당하는 누적 데이터 조회입니다.
  각 난이도별 조회 유저가 푼 문제와
  학급 전체가 푼 문제의 평균의 몫을 리턴합니다.
  classUuids는 ","로 구분하여 요청해주세요.
  작업자: 최현빈_vitabin (2024.06.17)
  `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccumulatePerformDto })
  @Get('accumulated-data-2')
  async getAccumulateData2Page(@Query() getAccumulateDto: GetAccumulateDto, @UUIDHeader() uuid: string): Promise<AccumulatePerformDto> {
    return await this.dashboardService.getAccumulate2Page(getAccumulateDto, uuid);
  }

  @ApiOperation({
    summary: '학생 대시보드 1번 참여학습별 조회 기능',
    description: `
    학급전체의 uuid와 해당 유저의 uuid를 각각 파라미터로 받습니다.
    학생 1번 대시보드에 해당하는 단원의 문제 학습단계 / 참여학습 문제 풀이 정오 / 개념학습시간 / 메타인지 / 학습참여를 조회합니다.
    classUuids는 ","로 구분하여 요청해주세요.
    작업자: 최현빈_vitabin (2024.06.26)
  `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: `
    평균 데이터는 반올림하여 Int값으로 리턴합니다.
    학습참여시간은 초단위로 반환합니다.
    오답문제 조회는 learning_sys_id로 조회하기 때문에
    오답문제 조회를 위한 learning_sys_id를 함께 리턴합니다.
    learning_sys_id: 소단원 ID
    ps. 로그인-로그아웃 시간, 횟수 조회 기능 추가 (24.06.26)
        공통인강 시청 여부 조회 추가 (24.07.02)
    `,
    schema: {
      example: {
        uuid: '772303eb-78e7-5d47-90bb-b1c369c414d9',
        learningSysId: 0,
        historyItem: {
          previousAchievementLevel: 5,
          afterAchievementLevel: 6,
          concepStudyVideo: 0,
          concepStudyExplain: 1,
          numProblem: 4,
          numIncorrectProblem: 1,
          numBasic: 4,
          numIncorrectBasic: 1,
          numConfirm: 2,
          numIncorrectConfirm: 1,
          numFeedback: 4,
          numIncorrectFeedback: 1,
          numAdditional: 4,
          numIncorrectAdditional: 1,
          metacognition: 10,
          metacognitionMiss: 5,
          studyParticipate: 5,
          numStudyParticipate: 600,
        },
        meanHistoryItem: {
          meanPreviousAchievementLevel: 0,
          meanAfterAchievementLevel: 0,
          meanConcepStudyVideo: 0,
          meanConcepStudyExplain: 0,
          meanBasic: 0,
          meanIncorrectBasic: 0,
          meanConfrim: 0,
          meanIncorrectConfrim: 0,
          meanFeedback: 0,
          meanIncorrectFeedback: 0,
          meanMetacognition: 0,
          meanMetacognitionMiss: 0,
          meanParticipate: 0,
          meanParticipateTimes: 0,
          meanAssignment: 0,
          meanIncorrectAssignment: 0,
        },
      },
    },
  })
  @Get('learning-history')
  async getLearningHistory(@Query() getLearningHistoryDto: GetLearningHistoryDto, @UUIDHeader() user_uuid: string): Promise<LearningHistoryDto> {
    return await this.dashboardService.getUserLearningHistory(getLearningHistoryDto, user_uuid);
  }

  @ApiOperation({
    summary: '학생 대시보드/취약 단원 난이도별 분석',
    description: `학생 대시보드에서 취약 단원 3개를 반환하는 API입니다.\n
    정확히 말하면, 최근 학습한 3개의 단원 중에서 가장 취약한 순으로 반환합니다.\n
    최근에 학습한 단원이 3개가 안된다면, 1개,2개가 반환될수도 있습니다.\n
    작업자 : 왕정희 (2024.06.12)
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Array<StudentWeakChaptersDto>,
    description: `각 소단원과 최상,상,중,하 난이도별 [문제 수, 오답 수]를 배열로 반환합니다.
    sum은 총 문제 수와 오답 수를 반환합니다.
    highest,high,middle,low,sum에 들어가는 배열의 첫번째 원소는 총 문제수이며
    두번째 원소는 오답 개수입니다. (맞춘 개수가 아님에 주의하세요.)
    오답률 계산은 프론트에서 하시면 됩니다.
    `,
    schema: {
      example: [
        {
          chapterName: '소단원 명',
          HIGHEST: [10, 10],
          HIGH: [10, 10],
          MIDDLE: [10, 5],
          LOW: [10, 10],
          SUM: [40, 35],
        },
      ],
    },
  })
  @Get('student-weak-chapters')
  async getStudentWeakChapters(@UUIDHeader() uuid: string, @Query() dto: GetStudentWeakChaptersDto): Promise<StudentWeakChaptersDto[]> {
    return await this.dashboardService.getStudentWeakChapters(uuid, dto);
  }

  @ApiOperation({
    summary: '학생 최근 3개 소단원 진도율',
    description: `학생 대시보드에서 최근 3개 소단원 진도율을 반환하는 API입니다.\n
    최근에 학습한 단원이 3개가 안된다면, 1개,2개가 반환될수도 있습니다.\n
    메인 대시보드에서 그래프를 그리는 용도로 사용하시면 되겠습니다.\n
    작업자 : 왕정희 (2024.06.12)
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Array<StudentProgressRateDto>,
    description: `
    chapterName:소단원 명
    learningMapNodeId:소단원의 map node ID입니다.
    progressRate:진도율입니다. (0~100)
    `,
    schema: {
      example: [
        {
          chapterName: '소단원 명',
          learningMapNodeId: 1,
          progressRate: 100,
        },
      ],
    },
  })
  @Get('student-progress-rates')
  async getStudentProgressRates(@UUIDHeader() uuid: string): Promise<StudentProgressRateDto[]> {
    return await this.dashboardService.getStudentProgressRates(uuid);
  }

  @ApiOperation({
    summary: '학생 최근 3개 소단원 학습시간',
    description: `학생 대시보드에서 최근 3개 소단원 학습시간을 초 단위로 반환하는 API입니다.\n
    최근에 학습한 단원이 3개가 안된다면, 1개,2개가 반환될수도 있습니다.\n
    메인 대시보드에서 그래프를 그리는 용도로 사용하시면 되겠습니다.\n
    작업자 : 왕정희 (2024.06.14)
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Array<StudentStudyDurationDto>,
    description: `
    chapterName:소단원 명
    learningMapNodeId:소단원의 map node ID입니다.
    progressRate:진도율입니다. (0~100)
    `,
    schema: {
      example: [
        {
          chapterName: '소단원 명',
          learningMapNodeId: 1,
          studyDuration: 59,
        },
      ],
    },
  })
  @Get('student-study-durations')
  async getStudentStudyDurations(@UUIDHeader() uuid: string): Promise<StudentStudyDurationDto[]> {
    return await this.dashboardService.getStudentStudyDurations(uuid);
  }

  @ApiOperation({
    summary: '학생 최근 3개 학습 단계',
    description: `학생 대시보드에서 최근 3개 소단원 학습단계를 반환하는 API입니다.\n
    최근에 학습한 단원이 3개가 안된다면, 1개,2개가 반환될수도 있습니다.\n
    메인 대시보드에서 그래프를 그리는 용도로 사용하시면 되겠습니다.\n
    작업자 : 왕정희 (2024.06.14)
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Array<StudentAchievementLevelDto>,
    description: `
    chapterName:소단원 명
    learningMapNodeId:소단원의 map node ID입니다.
    achievementLevel:학습 단계입니다. (1~10)
    `,
    schema: {
      example: [
        {
          chapterName: '소단원 명',
          learningMapNodeId: 1,
          achivementLevel: 7,
        },
      ],
    },
  })
  @Get('student-achievement-levels')
  async getStuentAchievementLevels(@UUIDHeader() uuid: string): Promise<StudentAchievementLevelDto[]> {
    return await this.dashboardService.getStuentAchievementLevels(uuid);
  }

  @ApiOperation({
    summary: '학습전략추천 문구를 위한 해당 Learning_sys를 기반으로 학생의 학습 현황 데이터 조회',
    description: `\n
    learning_sys_id를 dto로 넘겨주시면 학생이 해당 learning_sys를 얼마나 학습했는지 데이터를 반환합니다.\n
    학습전략추천 문구 자체를 한글 스트링으로 반환하지 않습니다.\n
    아래의 numeric 데이터를 받아서 프론트에서 처리하시면 됩니다.\n
    이렇게 하는 이유는 학습 전략 문구가 자주 변경될 것 같은 느낌이 들어서 프론트에서 자유자재로 받아서 사용하시는게 자을 것 같습니다.\n
    작업자 : 왕정희 (2024.06.14)
    * 프론트의 요청이 있어 수정했습니다. (2024.06.25) - 왕정희
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AverageDataDto,
    description: `
      percentage_study_duration : 해당 learning_sys의 학습시간 전체 기준 몇 퍼센트인지\n
      percentage_study_performs : 해당 learning_sys의 문제 풀이 수 전체 기준 몇 퍼센트인지\n
      percentage_correct_rate : 해당 learning_sys의 정답률 퍼센트\n
      achievement_level: 해당 learning_sys의 학생 학습 단계(아직 학습 단계를 파악할 수 없으면 0입니다.)\n
      performs_by_difficulty: 해당 learning_sys에서 학생 문제 풀이 난이도 별 group-by\n
      `,
    schema: {
      example: [
        {
          percentage_study_duration: 50,
          percentage_study_performs: 50,
          percentage_correct_rate: 70,
          achievement_level: 7,
          performs_by_difficulty: {
            HIGHEST: 10,
            HIGH: 10,
            MIDDLE: 10,
            LOW: 10,
            SUM: 10,
          },
        },
      ],
    },
  })
  @Get('strategy-comment-data')
  async getAverageDataForStrategyComment(@Query() dto: GetAverageDataDto, @UUIDHeader() uuid: string): Promise<AverageDataDto> {
    return await this.dashboardService.getAverageDataForStrategyComment(dto.learning_sys_id, uuid);
  }

  @ApiOperation({
    summary: '선생님 대시보드 학급 학생 학기 학습 목표',
    description: `\n선생님 대시보드에서 전체 학급 학생의 이번 학기 학습 목표를 가져옵니다.\n
    uuids에 학급에 속한 학생들 전원의 uuid를 넣어주십시오.\n
    작업자 : 왕정희 (2024.06.26)
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: `\n
    학생의 학기 학습 목표를 배열로 반환합니다.\n
    만약 학생이 장래희망을 적었을 경우 dream 키 안에 장래희망 데이터를 추가로 보냅니다.\n
    만약 장래희망이 없으면 null을 반환합니다.
    `,
    schema: {
      example: [
        {
          id: 1,
          uuid: 'EXAMPLE_UUID',
          semester_id: 1,
          progress_rate: 1,
          achievement_level: 1,
          correct_rate: 1,
          metarecognition_rate: 1,
          dream: {
            id: 1,
            user_uuid: 'EXAMPLE_UUID',
            dream_jobs: '1지망|2지망|3지망',
            dream_reason: '1지망이유|2지망이유|3지망이유',
            created_at: '2024-06-26 00:00:00',
          },
        },
      ],
    },
  })
  @Post('teacher-users-plan-notes')
  @Roles([Role.Teacher])
  async getTeacher(@Body() dto: GetTeacherUserPlanNotesDto, @UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo): Promise<UserPlanNoteDto[]> {
    return await this.dashboardService.getTeacherUserPlanNotes(dto, uuid, classInfo);
  }

  @ApiOperation({
    summary: '선생님 대시보드/취약 단원 난이도별 분석',
    description: `선생님 대시보드에서 취약 단원 3개를 반환하는 API입니다.\n
    이전, 전전 학습한 노드가 없다면 배열 길이가 1,2가 될 수 있습니다.\n
    작업자 : 왕정희 (2024.06.12)
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: `각 소단원과 최상,상,중,하 난이도별 [문제 수, 오답 수]를 배열로 반환합니다.
    sum은 총 문제 수와 오답 수를 반환합니다.
    highest,high,middle,low,sum에 들어가는 배열의 첫번째 원소는 총 문제수이며
    두번째 원소는 오답 개수입니다. (맞춘 개수가 아님에 주의하세요.)
    오답률 계산은 프론트에서 하시면 됩니다.
    `,
    schema: {
      example: [
        {
          chapterName: '소단원 명',
          HIGHEST: [10, 10],
          HIGH: [10, 10],
          MIDDLE: [10, 5],
          LOW: [10, 10],
          SUM: [40, 35],
        },
      ],
    },
  })
  @Post('teacher-weak-chapters')
  @Roles([Role.Teacher])
  async getTeacherWeakChapters(@Body() dto: GetTeacherWeakChaptersDto, @UUIDHeader() uuid: string): Promise<TeacherWeakChaptersDto[]> {
    return await this.dashboardService.getTeacherWeakChapters(dto, uuid);
  }

  @ApiOperation({
    summary: '평가 분석표 조회',
    description: `선생님 대시보드에서 평가 분석표를 조회하는 API입니다.
  학급 전체의 UUID와 평가 아이디를 파라미터로 받습니다.
  classUuids는 ","로 구분하여 요청해주세요.
  작업자: 최현빈_vitabin (2024.06.14)
  `,
  })
  @ApiOkResponse({
    description: `
  해당 평가의 분석표 아이템들을 페이지네이션 없이 리턴합니다.
  'results'는 푼 문제 갯수만큼의 길이를 가집니다.
  각 문제별 평균 정답률, 평균 점수, 평균 학습단계는 프론트에서 계산하시면 됩니다.`,
    schema: {
      example: [
        {
          user_uuid: 'vitabin',
          achievement_level: 8,
          score: 10,
          results: [
            {
              problem_id: 1,
              is_correct: 1,
              difficulty: 'HIGH',
            },
            {
              problem_id: 20,
              id_correct: 1,
              difficutly: 'LOW',
            },
          ],
        },
      ],
    },
  })
  @Get('assessment-history')
  @Roles([Role.Teacher])
  async getAssessmentResultBoard(@Query() getAssessmentHistoryDto: GetAssessmentHistoryDto): Promise<ResultBoardDto[]> {
    return await this.dashboardService.getAssessmentResultBoard(getAssessmentHistoryDto);
  }

  @ApiOperation({
    summary: '최근에 학습한 2개 소단원에서 학습 단계가 계속 하락하는 학생들의 목록을 조회하는 API입니다. 작업자: 강현길',
    description: `최근에 학습한 2개 소단원에서 학습 단계가 계속 하락하는 학생들의 목록을 조회하는 API입니다.
    소단원의 표준학습체계 ID와 페이지, 페이지수를 정해서 조회하시면 됩니다.`,
  })
  @Get('descending-students')
  @Roles([Role.Teacher])
  async getDescendingIn2SubsectionsStudents(@Query() dto: GetDescendingIn2StudentsDto): Promise<GetDescendingIn2SubsectionsStudentsResponseDto> {
    const result = await this.dashboardService.getDescendingIn2SubsectionsStudents(dto);

    return {
      correctRate: result.correctRateStudents,
      learningLevel: result.learningLevelStudents,
      learningTime: result.learningTimeStudents,
      problemSolvingCount: result.problemSolvingCountStudents,
    };
  }

  @ApiOperation({
    summary: `선생님 대시보드 1번 참여학습별 조회 기능`,
    description: `선생님 대시보드 1번에서 학급 전체의 해당하는 단원의 문제 학습단계 / 참여학습 문제 풀이 정오 / 개념학습시간 / 메타인지 / 학습참여를 조회합니다. \n
    학급 전체의 UUID와 learning_sys_id를 파라미터로 받습니다.
    평균 데이터는 반올림하여 Int값으로 리턴합니다.
    학습참여시간은 초단위로 반환합니다.
    오답문제 조회는 learning_sys_id로 조회하기 때문에
    오답문제 조회를 위한 learning_sys_id를 함께 리턴합니다.
    learning_sys_id: 소단원 ID
    ps. 로그인-로그아웃 시간, 횟수 조회 기능 추가 (24.06.26)
        공통인강 시청 여부 조회 추가 (24.07.02)
    작업자: 최현빈_vitabin (2024.06.26)
    `,
  })
  @ApiOkResponse({
    description: `각 학생별로 dashboard/learning-history에 해당하는 아이템들을 배열에 담아 반환합니다.`,
    schema: {
      example: [
        {
          uuid: '772303eb-78e7-5d47-90bb-b1c369c414d9',
          learningSysId: 0,
          historyItem: {
            previousAchievementLevel: 5,
            afterAchievementLevel: 6,
            concepStudyVideo: 0,
            concepStudyExplain: 1,
            numProblem: 4,
            numIncorrectProblem: 1,
            numBasic: 4,
            numIncorrectBasic: 1,
            numConfirm: 2,
            numIncorrectConfirm: 1,
            numFeedback: 4,
            numIncorrectFeedback: 1,
            numAdditional: 4,
            numIncorrectAdditional: 1,
            metacognition: 10,
            metacognitionMiss: 5,
            studyParticipate: 5,
            numStudyParticipate: 600,
            numAssignment: 4,
            numIncorrectAssignment: 0,
          },
          meanHistoryItem: {
            meanPreviousAchievementLevel: 0,
            meanAfterAchievementLevel: 0,
            meanConcepStudyVideo: 0,
            meanConcepStudyExplain: 0,
            meanBasic: 0,
            meanIncorrectBasic: 0,
            meanConfrim: 0,
            meanIncorrectConfrim: 0,
            meanFeedback: 0,
            meanIncorrectFeedback: 0,
            meanMetacognition: 0,
            meanMetacognitionMiss: 0,
            meanParticipate: 0,
            meanParticipateTimes: 0,
            meanAssignment: 0,
            meanIncorrectAssignment: 0,
          },
        },
        {
          uuid: '678912eb-78e7-5d47-90bb-b1c369c414d9',
          learningSysId: 0,
          historyItem: {},
          meanHistoryItem: {},
        },
      ],
    },
  })
  @Roles([Role.Teacher])
  @Get('class-learning-history')
  async getClassLearningHistory(@Query() getLearningHistoryDto: GetLearningHistoryDto): Promise<LearningHistoryDto[]> {
    return await this.dashboardService.classLearningHistory(getLearningHistoryDto);
  }

  @ApiOperation({
    summary: '학생 대시보드의 그레프 데이터 조회',
    description: `학생 대시보드 1번의 그래프 데이터를 조회합니다.\n
    학급 전체의 UUID와 learning_sys_id, user_uuid를 파라미터로 받습니다.
    classUuids는 ","로 구분하여 요청해주세요.
    현재 진도율은 개념영상 시청 여부를 제외하고 구현되어있습니다.
    작업자: 최현빈_vitabin (24.06.20)`,
  })
  @ApiOkResponse({
    description: `\n
    각 그래프에 필요한 아이탬들을 반환합니다.
    각 그래프별 아이탬은 itemName으로 구분합니다.
    목표를 설정하지 않았다면 null을 리턴합니다`,
    schema: {
      example: {
        userUuid: 'test',
        learningSysId: 0,
        learningSysName: '이차방정식',
        statisticItems: [
          {
            itemName: 'LEVEL',
            goal: 5,
            userAchievement: 5,
            meanAchievement: 6,
          },
          {
            itemName: 'CORRECT_RATE',
            goal: 5,
            userAchievement: 5,
            meanAchievement: 6,
          },
          {
            itemName: 'METACOGNITION',
            goal: 5,
            userAchievement: 5,
            meanAchievement: 6,
          },
          {
            itemName: 'PROGRESS',
            goal: 10,
            userAchievement: 7,
            meanAchievement: 5,
          },
        ],
      },
    },
  })
  @Get('student-statistics')
  async getStatistics(@Query() getLearningHistoryDto: GetLearningHistoryDto, @UUIDHeader() userUuid: string): Promise<StatisticDto> {
    return await this.dashboardService.getStudentStatistic(getLearningHistoryDto, userUuid);
  }

  @ApiOperation({
    summary: '학생 대시보드 2번 최근 3개 단원 그레프 데이터 조회',
    description: `학생 대시보드 2번의 그래프 데이터를 조회합니다.\n
    학급 전체의 UUID와 learning_sys_id, user_uuid를 파라미터로 받습니다.
    classUuids는 ","로 구분하여 요청해주세요.
    현재 진도율은 개념영상 시청 여부를 제외하고 구현되어있습니다.
    작업자: 최현빈_vitabin (24.06.20)`,
  })
  @ApiOkResponse({
    description: `\n
    최근 3개단원의 그래프 데이터들를 반환합니다.
    student-statistics의 객체들을 배열에 담아 반환합니다.`,
    schema: {
      example: [
        {
          userUuid: 'test',
          learningSysId: 0,
          learningSysName: '이차방정식',
          statisticItems: [],
        },
        {
          userUuid: 'test',
          learningSysId: 0,
          learningSysName: '다차방정식',
          statisticItems: [],
        },
        {
          userUuid: 'test',
          learningSysId: 0,
          learningSysName: '삼각함수',
          statisticItems: [],
        },
      ],
    },
  })
  @Get('student-statistics-recent')
  async getLast3Statistics(@Query() getLearningHistoryDto: GetLearningHistoryDto, @UUIDHeader() userUuid: string): Promise<StatisticDto[]> {
    return await this.dashboardService.getLast3Statistics(getLearningHistoryDto, userUuid);
  }

  @ApiOperation({
    summary: '선생님 대시보드 1번의 그레프 데이터 조회',
    description: `\n
    선생님 대시보드 1번의 그래프 데이터를 조회합니다.
    학급 전체의 UUID와 learning_sys_id를 파라미터로 받습니다.
    classUuids는 ","로 구분하여 요청해주세요.
    현재 진도율은 개념영상 시청 여부를 제외하고 구현되어있습니다.
    작업자: 최현빈_vitabin (24.06.20)`,
  })
  @ApiOkResponse({
    description: `\n
    각 그래프에 필요한 아이탬들을 반환합니다.
    각 그래프별 아이탬은 itemName으로 구분합니다.
    student-statistic와 동일한 객체이지만 userAchievement가 없습니다.`,
    schema: {
      example: {
        learningSysId: 0,
        learningSysName: '이차방정식',
        statisticItems: [
          {
            itemName: 'LEVEL',
            goal: 5,
            meanAchievement: 6,
          },
          {
            itemName: 'CORRECT_RATE',
            goal: 5,
            meanAchievement: 6,
          },
          {
            itemName: 'METACOGNITION',
            goal: 5,
            meanAchievement: 6,
          },
          {
            itemName: 'PROGRESS',
            goal: 10,
            meanAchievement: 5,
          },
        ],
      },
    },
  })
  @Roles([Role.Teacher])
  @Get('teacher-statistics')
  async getTeacherStatistic(@Query() getLearningHistoryDto: GetLearningHistoryDto): Promise<StatisticDto> {
    return await this.dashboardService.getClassStatistic(getLearningHistoryDto);
  }

  @ApiOperation({
    summary: '선생님 대시보드 2번의 그레프 데이터 조회',
    description: `선생님 대시보드 2번의 그래프 데이터를 조회합니다.\n
    학급 전체의 UUID와 learning_sys_id를 파라미터로 받습니다.
    classUuids는 ","로 구분하여 요청해주세요.
    현재 진도율은 개념영상 시청 여부를 제외하고 구현되어있습니다.
    작업자: 최현빈_vitabin (24.06.20)`,
  })
  @ApiOkResponse({
    description: `\n
    최근 3개단원의 그래프 데이터들를 반환합니다.
    teacher-statistics의 객체들을 배열에 담아 반환합니다.`,
    schema: {
      example: [
        {
          learningSysId: 0,
          learningSysName: '이차방정식',
          statisticItems: [],
        },
        {
          learningSysId: 0,
          learningSysName: '다차방정식',
          statisticItems: [],
        },
        {
          learningSysId: 0,
          learningSysName: '삼각함수',
          statisticItems: [],
        },
      ],
    },
  })
  @Get('teacher-statistics-recent')
  async getLast3TeacherStatistics(@Query() getLearningHistoryDto: GetLearningHistoryDto): Promise<StatisticDto[]> {
    return await this.dashboardService.getLast3ClassStatistics(getLearningHistoryDto);
  }

  @ApiOperation({ summary: '학생의 학습참여 상세정보를 조회하는 API입니다. 작업자: 강현길' })
  @ApiQuery({ name: 'curriculumId', type: String, description: '표준학습체계 ID입니다.' })
  @Get('learning-time-history')
  async getLearningTimeHistory(@Query('curriculumId') curriculumId: string, @UUIDHeader() uuid: string): Promise<GetLearningHistoryOfUserResponseDto> {
    return await this.historyService.getLearningHistoryOfUser(uuid, curriculumId);
  }

  @ApiOperation({
    summary: 'MVP 조회',
    description: '작업자: 최현빈_vitabin 24.08.02',
  })
  @ApiOkResponse({ type: MvpDto })
  @HttpCode(HttpStatus.OK)
  @Get('mvp')
  async getMVP(@Query() getAccumulateDto: GetAccumulateDto): Promise<MvpDto> {
    return await this.dashboardService.getMVP(getAccumulateDto);
  }

  @ApiOperation({
    summary: '성취 수준 조회 API',
    description: '작업자: 구성모',
  })
  @ApiOkResponse({
    description: `\n
    성취 기준 테이블 정보를 달성한 등급에 맞게 가져온다.`,
    schema: {
      example: {
        id: 1,
        achievement_id: '[10공수1-01-01]',
        achievement_desc: '다항식의 사칙연산의 원리를 설명하고, 그 계산을 할 수 있다.',
        eval_model: 'SHORT_SELECT',
        model_desc: '다항식의 계산을 할 수 있다.',
        achievement_level: 'B',
        level_desc: '다항식의 사칙연산의 원리를 이해하여 설명할 수 있으며, 그 계산을 할 수 있다. ',
        created_at: '2024-08-01 13:49:16',
        updated_at: '2024-08-01 13:49:16',
        deleted_at: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('achievement-standard')
  async getAchievementStandard(
    @Query() getAchievementStandardDto: GetAchievementStandardDto,
    @UUIDHeader() uuid: string,
  ): Promise<studentAchievementStandardResponseDto> {
    return await this.dashboardService.getAchievementStandard(getAchievementStandardDto, uuid);
  }

  @ApiOperation({
    summary: '(선생님)학생들 성취 수준 조회 API',
    description: '작업자: 구성모',
  })
  @ApiOkResponse({
    description: `\n
    여러명의 학생들의 성취 기준 테이블 정보를 달성한 등급에 맞게 가져온다.`,
    schema: {
      example: [
        {
          id: 1,
          achievement_id: '[10공수1-01-01]',
          achievement_desc: '다항식의 사칙연산의 원리를 설명하고, 그 계산을 할 수 있다.',
          eval_model: 'SHORT_SELECT',
          model_desc: '다항식의 계산을 할 수 있다.',
          achievement_level: 'B',
          level_desc: '다항식의 사칙연산의 원리를 이해하여 설명할 수 있으며, 그 계산을 할 수 있다. ',
          created_at: '2024-08-01 13:49:16',
          updated_at: '2024-08-01 13:49:16',
          deleted_at: null,
        },
        {
          id: 1,
          achievement_id: '[10공수1-01-01]',
          achievement_desc: '다항식의 사칙연산의 원리를 설명하고, 그 계산을 할 수 있다.',
          eval_model: 'SHORT_SELECT',
          model_desc: '다항식의 계산을 할 수 있다.',
          achievement_level: 'B',
          level_desc: '다항식의 사칙연산의 원리를 이해하여 설명할 수 있으며, 그 계산을 할 수 있다. ',
          created_at: '2024-08-01 13:49:16',
          updated_at: '2024-08-01 13:49:16',
          deleted_at: null,
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('achievement-standard-users')
  async getAchievementStandardUsers(
    @Query() getAchievementStandardUsersDto: GetAchievementStandardUsersDto,
  ): Promise<Promise<studentAchievementStandardResponseDto>[]> {
    return await this.dashboardService.getAchievementStandardUsers(getAchievementStandardUsersDto);
  }

  @ApiOperation({
    summary: '특정 학생의 uuid + 소단원 ID + 학습 유형(과제 포함) 으로 해당 학생이 틀린 문제를 조회한다. (왕정희)',
    description: '헤더 UUID에는 선생님 UUID를, Roles는 T를 넣어주세요. 학습 유형(type) 은 BASIC, CONFIRM, FEEDBACK, ASSIGNMENT 중 하나를 넣어주세요.',
  })
  @Roles([Role.Teacher])
  @Post('teacher/student-performs')
  @HttpCode(HttpStatus.OK)
  async getStudentPerformsByLearningSysId(@Body() dto: GetTeacherDashboardProblemsDto, @UUIDHeader() uuid: string) {
    return await this.dashboardService.getStudentPerformsByLearningSysId(dto, uuid);
  }

  @ApiOperation({
    summary: '특정 학생의 uuid + 소단원 ID 로 해당 학생이 올린 개념 공유 영상을 전부 가져온다. (왕정희)',
    description: '헤더 UUID에는 선생님 UUID를, Roles는 T를 넣어주세요.',
  })
  @Roles([Role.Teacher])
  @Post('teacher/concept-videos')
  @HttpCode(HttpStatus.OK)
  async getStudentConceptVideosByLearningSysId(@Body() dto: GetTeacherDashboardConceptVideosDto, @UUIDHeader() uuid: string) {
    return await this.dashboardService.getStudentConceptVideosByLearningSysId(dto, uuid);
  }

  @ApiOperation({
    summary: '유저 학습현황 업데이트',
    description: `
    유저의 학습현황을 업데이트하는 API입니다.
    대시보드 진입 시 필히 호출하여주세요.
    작업자: 최현빈_vitabin 24.08.13
    `,
  })
  @ApiOkResponse({
    schema: {
      example: {
        user_uuid: 'string',
        learning_map_id: 'number | null',
        current_learning_node_id: 'number | null',
        created_at: new Date(),
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Patch('')
  async updateUserLearningStatus(@UUIDHeader() uuid: string) {
    return await this.dashboardService.validateOrUpdateUserLearningStatus(uuid);
  }
}
