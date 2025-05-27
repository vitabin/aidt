import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { SchoolClassHeader, classInfoHeaderDesc } from 'src/libs/decorators/school-class-header.decorator';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { AdjustLearningLevelOfStudentsDto, ContentTableDto, GetClassProgressInSection, GetSectionProgressDto, LearningSystemDto, SetBookMarker } from '..';
import { LearningService } from '../application/learning.service';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { Role } from 'src/libs/decorators/role.enum';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('learning')
@Controller({ path: 'learning', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class LearningController {
  constructor(private readonly service: LearningService) {}
  @ApiOperation({
    summary: '학생들의 학습단계를 조정하는 API입니다. 작업자: 강현길',
    description: `학생들의 학습단계를 조정하는 API입니다.
    학생 UUID와 설정할 학습단계, 그리고 해당 단원의 표준학습체계 ID를 담아서 보내주시면 됩니다.`,
  })
  @ApiBody({
    type: AdjustLearningLevelOfStudentsDto,
    schema: {
      example: {
        uuidLevelPairs: [
          { uuid: 'uuid1', level: 1 },
          { uuid: 'uuid2', level: 2 },
        ],
        learningSysId: 1,
        achievementType: 'DIAGNOSTIC',
      },
    },
  })
  @Roles([Role.Teacher])
  @Patch('level')
  @ApiHeader(classInfoHeaderDesc)
  async adjustLearningLevelOfStudents(@Body() dto: AdjustLearningLevelOfStudentsDto, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.service.adjustLearningLevelOfStudents(dto, classInfo);
  }

  @ApiOperation({
    summary: '학생들의 목차를 조회하는 API입니다. (구성모, 왕정희)',
    description: `특정 학년의 특정 학기의 단원을 조회한다.
    헤더로 Class-Info와 Uuid를 주셔야합니다.
    grade : 사용자의 학년을 1~12까지 구분. 초1~6 : 1~6, 중1~3 : 7~9, 고1~3 : 10~12
    semester : 사용자의 학기를 입력받음. 1학기 : 1, 2학기 2
    작업자 : 구성모, 왕정희`,
  })
  @Get('content-table')
  @ApiHeader(classInfoHeaderDesc)
  async getAllContentTable(@Query() dto: ContentTableDto, @SchoolClassHeader() classInfo: ClassInfo, @UUIDHeader() uuid: string) {
    return await this.service.getAllContentTable(dto, classInfo, uuid);
  }

  @ApiOperation({
    summary: '유저의 현재 단원의 정보를 조회',
    description: `
    유저가 속해있는 현재 단원의 정보를 리턴합니다.
    작업자: 최현빈_vitabin 24.06.25
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: `
    유저가 속해있는 현재단원의 정보를 리턴합니다.
    학년, 학기, 단원ID, 표준학습체계ID, 단원분류, 단원이름, 단원 전체 이름을 리턴합니다.
    표준학습체계ID는 nullable입니다.
    `,
    schema: {
      example: {
        grade: 1,
        semester: 1,
        learningSysId: 123,
        clsId: 'E6MATA01B01C01',
        type: 'UNIT',
        name: '소인수분해',
        fullName: '수와 연산 소인수분해',
        achievementDesc: 'string | null',
      },
    },
  })
  @Get('learning-system/:uuid')
  async getLearningSystem(@Param('uuid') uuid: string): Promise<LearningSystemDto> {
    return await this.service.getLearningSystemInfo(uuid);
  }

  @ApiOperation({
    summary: '단원 정보를 조회',
    description: `
    단원의 정보를 리턴합니다.
    작업자: 최현빈_vitabin 24.06.25
    `,
  })
  @ApiOkResponse({
    description: `
    학년, 학기, 단원ID, 표준학습체계ID, 단원분류, 단원이름, 단원 전체 이름을 리턴합니다.
    표준학습체계ID(clsId)는 소단원, 확장소단원에만 존재하기때문에 nullable입니다.
    `,
    schema: {
      example: {
        grade: 1,
        semester: 1,
        learningSysId: 123,
        clsId: 'E6MATA01B01C01',
        type: 'UNIT',
        name: '소인수분해',
        fullName: '수와 연산 소인수분해',
        achievementDesc: 'string | null',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('learning-system')
  async getAdditionalLearningSystem(@Query() query: GetSectionProgressDto): Promise<LearningSystemDto> {
    return await this.service.getAdditionalLearningSysInfo(parseInt(query.learningSysId));
  }

  @ApiOperation({
    summary: '소단원 속 학생의 진행단계 조회',
    description: '작업자: 최현빈_vitabin 24.07.02',
  })
  @ApiOkResponse({
    description: '완료하였으면 DONE 진행중이면 PENDING을 리턴합니다',
    schema: {
      example: {
        concept: 'DONE',
        basicLearning: 'DONE',
        confirmLearning: 'PENDING',
        feedbackLearning: 'PEDNNG',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('learning-system/progress/student')
  async getProgressInSectionStudent(@Query() query: GetSectionProgressDto, @UUIDHeader() uuid: string) {
    return await this.service.getProgressInSectionStudent(parseInt(query.learningSysId), uuid);
  }

  @ApiOperation({
    deprecated: true,
    summary: '소단원 속 학급의 진행단계 조회',
    description: '작업자: 최현빈_vitabin 24.07.02',
  })
  @ApiOkResponse({
    description: '완료하였으면 DONE 진행중이면 PENDING을 리턴합니다',
    schema: {
      example: {
        concept: 'DONE',
        basicLearning: 'DONE',
        confirmLearning: 'PENDING',
        feedbackLearning: 'PEDNNG',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('learning-system/progress/teacher')
  async getProgressInSectionClass(@Query() getClassProgressInSection: GetClassProgressInSection) {
    const classUuids = getClassProgressInSection.classUuids.split(',').map((uuid: string) => uuid.trim());
    const learningSysId = Number(getClassProgressInSection.learningSysId);
    return await this.service.getProgressInSectionClass(learningSysId, classUuids);
  }

  @ApiOperation({
    summary: '대단원 목차 책갈피 기능',
    description: '작업자: 최현빈_vitabin 24.07.03',
  })
  @ApiOkResponse({
    schema: {
      example: [
        [
          {
            learningSysId: 984,
            learningSysName: '7||1||수와 연산||소인수분해||소인수분해||소수와 합성수',
            status: 'PENDING',
          },
          {
            learningSysId: 985,
            learningSysName: '7||1||수와 연산||소인수분해||소인수분해||소인수분해',
            status: 'PENDING',
          },
          {
            learningSysId: 986,
            learningSysName: '7||1||수와 연산||소인수분해||소인수분해||소인수분해를 이용하여 약수 구하기',
            status: 'PENDING',
          },
        ],
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('book-marker/unit')
  async getBookMarkerUnit(@Query() query: GetSectionProgressDto, @UUIDHeader() uuid: string) {
    return await this.service.bookmarkerUnit(parseInt(query.learningSysId), uuid);
  }

  @ApiOperation({
    summary: '전체 목차에 대한 유저별 책갈피 기능',
    description: '유저 uuid와 유저의 class-info를 헤더로 받습니다.',
  })
  @ApiOkResponse({
    schema: {
      example: [
        {
          learningSysId: 984,
          learningSysName: '7||1||수와 연산||소인수분해||소인수분해||소수와 합성수',
          status: 'PENDING',
        },
        {
          learningSysId: 985,
          learningSysName: '7||1||수와 연산||소인수분해||소인수분해||소인수분해',
          status: 'PENDING',
        },
        {
          learningSysId: 986,
          learningSysName: '7||1||수와 연산||소인수분해||소인수분해||소인수분해를 이용하여 약수 구하기',
          status: 'PENDING',
        },
        {
          learningSysId: 988,
          learningSysName: '7||1||수와 연산||소인수분해||최대공약수와 최소공배수||소인수분해를 이용하여 최대공약수 구하기',
          status: 'PENDING',
        },
        {
          learningSysId: 989,
          learningSysName: '7||1||수와 연산||소인수분해||최대공약수와 최소공배수||서로소',
          status: 'PENDING',
        },
      ],
    },
  })
  @ApiHeader(classInfoHeaderDesc)
  @Get('book-marker/semester')
  async getbookmarkerSemester(@UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.service.bookMarkSemester(uuid, classInfo);
  }

  @ApiOperation({
    summary: '선생님용 책갈피 생성, 업데이트',
    description: `
    선생님 UUID를 haeder로, learningSysId와 status를 body로 받습니다.
    status: 1 = 체크 표시, status: 0 = 체크표시 해제
    작업자: 최현빈_vitabin 24.07.22
    `,
  })
  @ApiBody({
    schema: {
      example: {
        learningSysId: 1,
        status: 1,
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: {
        id: 0,
        user_uuid: 'test',
        learning_sys_id: 0,
        semester: 1,
        status: 1,
      },
    },
  })
  @Roles([Role.Teacher])
  @Post('book-marker/menual')
  async setBookmarker(@UUIDHeader() uuid: string, @Body() setBookMarker: SetBookMarker) {
    return await this.service.setBookMarker(uuid, setBookMarker);
  }

  @ApiOperation({
    summary: '북마커 조회',
    description: `
    학기별로 생성된 북마커 표시를 한 객체만 리턴합니다.
    아무 단원도 표시하지 않았다면 null을 리턴합니다.
    선생님 uuid와 classInfo를 haeder로 받습니다.
    작업자: 최현빈_vitabin 24.07.23`,
  })
  @ApiOkResponse({
    schema: {
      example: {
        id: 1,
        user_uuid: 'string',
        learning_sys_id: 1,
        semester: 1,
        status: 1,
      },
    },
  })
  @Get('book-marker/checked')
  async getCheckedBookmarker(@UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.service.getCheckedBookmarker(uuid, classInfo);
  }
}
