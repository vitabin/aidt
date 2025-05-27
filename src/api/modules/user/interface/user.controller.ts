/* eslint-disable sonarjs/no-duplicate-string */
import { Body, Controller, Get, Post, Query, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { UserService } from '../application';
import { Role } from 'src/libs/decorators/role.enum';
import {
  AuthorizeDto,
  CreateDreamJobDto,
  GetDreamJobsAccumulatedResponseDto,
  GetDreamJobsDto,
  GetRecentUserStatusResponseDto,
  PostUserStatusDto,
  RespAuthorizeUuidDto,
} from '../application/dto';
import { user_plan_note } from '@prisma/client';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
import { classInfoHeaderDesc, SchoolClassHeader } from 'src/libs/decorators/school-class-header.decorator';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { RoleHeader } from 'src/libs/decorators/roleHeader.decorator';
import { CreateDreamJobBulkDto } from '../application/dto/create-dream-job-bulk.dto';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('user')
@Controller({ path: 'user', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'UUID를 검증한다.',
    description: `\n
    유저의 UUID를 검증 및 등록이 되어있지 않으면 저희 db에 등록합니다.\n
    최초 로그인 시, 공공 API에서 uuid값을 불러온 직후에 반드시 호출해주셔야합니다.\n
    반드시 학년도를 시작하기 위해서는 교사가 학생들보다 먼저 로그인을 해야 합니다. 그 전까지는 학생들은 교과서를 이용할 수 없습니다.\n
    로그인 할 때마다 호출하셔도 성능에 문제가 없으니 매번 호출해서 교사보다 학생이 먼저 교과서로 들어와 유효하지 않은 데이터들을 보지 않도록 하는 게 좋겠습니다.\n\n
    교사가 이 API를 호출했을 때 우리 DB에 학급 정보가 없을 경우, 학교 -> 학급 -> 시간표 순으로 데이터를 생성합니다.\n
    이 경우 적절한 학습맵이 구축되어 있지 않은 경우 실패합니다.\n
    학급 데이터를 구축할 경우 Keris API가 많이 사용되어 PartnerId와 accessToken 등이 필요합니다. 
    작업자 : 왕정희, 강현길
    `,
  })
  @ApiOkResponse({
    description: 'UUID가 최초로 등록되었다면, created:true 가, 이미 등록되어있다면 created:false 가 반환됩니다. 그리고 학생이라면 유저 객체를 반환합니다.',
    schema: {
      example: {
        created: true,
        user: {
          user_uuid: 'EXAMPLE_UUID',
          learning_map_id: 1,
          current_learning_node_id: 1,
          created_at: '2024-06-11T00:00:00.000Z',
        },
      },
    },
  })
  @Post('authorize')
  @ApiHeader(classInfoHeaderDesc)
  async authorizeUuid(
    @UUIDHeader() uuid: string,
    @RoleHeader() role: Role,
    @SchoolClassHeader() classInfo: ClassInfo,
    @Body() dto: AuthorizeDto,
  ): Promise<RespAuthorizeUuidDto> {
    return await this.userService.authorizeMemberUuid(uuid, role, classInfo, dto);
  }

  @ApiOperation({
    summary: '학생 장래희망 직업 추가/수정',
    description: `\n학생 장래희망 직업을 추가/수정하는 API입니다.\n
    index에는 0,1,2 값중 하나를 적어주세요. 0은 1지망, 1은 2지망, 2는 3지망을 의미합니다.\n
    장래희망은 20자로 input의 maxlength값을 설정해주십시오.\n
    20자를 넘는 데이터는 어차피 자동으로 백엔드에서 자르게 됩니다.\n
    이유는 255자 제한이므로 255자를 넘는 데이터는 자동으로 잘립니다.\n
    이유는 필수 입력 사항이 아니므로 학생이 적은 값이 없으면 '' 으로 보내주세요.\n
    작업자 : 왕정희 (2024.06.11)\n
    `,
  })
  @ApiOkResponse({
    description: 'user_plan_note 객체 하나를 반환합니다.',
    schema: {
      example: {
        id: 1,
        user_uuid: 'EXAMPLE_UUID',
        dream_jobs: '1지망|2지망|3지망',
        dream_reason: '1지망이유|2지망이유|3지망이유',
        created_at: '2024-06-11T00:00:00.000Z',
      },
    },
  })
  @Post('dream-job')
  @Roles([Role.Student])
  async createDreamJob(@Body() dto: CreateDreamJobDto, @UUIDHeader() uuid: string): Promise<user_plan_note> {
    return await this.userService.createDreamJob(dto, uuid);
  }

  @ApiOperation({
    summary: '학생 장래희망 직업 한번에 1~3지망 추가 (작업자 왕정희)',
    description: `\n학생 장래희망 직업을 한번에 1~3지망까지 추가하는 API입니다.\n
    장래희망은 20자로 input의 maxlength값을 설정해주십시오.\n
    20자를 넘는 데이터는 어차피 자동으로 백엔드에서 자르게 됩니다.\n
    이유는 255자 제한이므로 255자를 넘는 데이터는 자동으로 잘립니다.\n
    이유는 필수 입력 사항이 아니므로 학생이 적은 값이 없으면 '' 으로 보내주세요.\n
    그리고, 1지망 장래희망은 반드시 입력하여야 하는 필수사항입니다.\n
    작업자 : 왕정희 (2024.07.24)\n
    `,
  })
  @ApiOkResponse({
    description: 'user_plan_note 객체 하나를 반환합니다.',
    schema: {
      example: {
        id: 1,
        user_uuid: 'EXAMPLE_UUID',
        dream_jobs: '1지망|2지망|3지망',
        dream_reason: '1지망이유|2지망이유|3지망이유',
        created_at: '2024-06-11T00:00:00.000Z',
      },
    },
  })
  @Post('dream-job/bulk')
  @Roles([Role.Student])
  async createDreamJobBulk(@Body() dto: CreateDreamJobBulkDto, @UUIDHeader() uuid: string): Promise<user_plan_note> {
    return await this.userService.createDreamJobBulk(dto, uuid);
  }

  @ApiOperation({
    summary: '학생의 장래희망 직업 조회',
    description: `\n학생의 장래희망 직업을 조회하는 API입니다.\n
    created_at 컬럼을 기준으로 내림차순(DESC)으로 정렬되어 반환됩니다.\n
    배열의 0번째 원소를 가져다 쓰시면 가장 최근의 장래희망을 가져올 수 있습니다.\n
    dream_jobs는 "1지망|2지망|3지망" 형식으로 반환되므로 split('|')을 통해 각 지망을 분리해주어야 합니다.\n
    dream_reason또한 "1지망이유|2지망이유|3지망이유" 형식으로 반환되므로 split('|')을 통해 각 지망의 이유를 분리해주어야 합니다.\n
    query string의 take 값으로 반환할 데이터의 개수를 설정할 수 있습니다.
    기본값은 1입니다. (가장 최근의 데이터 1개만 반환됩니다.)\n
    1개를 반환하더라도 Array<user_plan_note>로 반환되니 response의 0번째 원소에 접근해야 한다는 점을 주의해주세요.\n
    작업자 : 왕정희 (2024.06.11)
    `,
  })
  @ApiOkResponse({
    description: 'user_plan_note 객체 여러개를 반환합니다.',
    schema: {
      example: [
        {
          id: 1,
          user_uuid: 'EXAMPLE_UUID',
          dream_jobs: '1지망|2지망|3지망',
          created_at: '2024-06-11T00:00:00.000Z',
          dream_reason: '이유가 있으면 여기에 저장됩니다. 없으면 null입니다.',
        },
        {
          id: 2,
          user_uuid: 'EXAMPLE_UUID',
          dream_jobs: '1지망|2지망|3지망',
          created_at: '2024-06-11T00:00:00.000Z',
          dream_reason: '이유가 있으면 여기에 저장됩니다. 없으면 null입니다.',
        },
      ],
    },
  })
  @Get('dream-jobs')
  @Roles([Role.Student])
  async getDreamJobs(@Query() dto: GetDreamJobsDto, @UUIDHeader() uuid: string): Promise<user_plan_note[]> {
    return await this.userService.getDreamJobs(dto, uuid);
  }

  @ApiOperation({ summary: '학생이 입력한 장래희망 중 빈도 수가 가장 높은 세 장래희망을 조회하는 API입니다. 작업자: 강현길' })
  @ApiResponse({
    status: 200,
    description: 'user_plan_note 객체를 반환합니다.',
    schema: {
      example: {
        의사: 5,
        교사: 3,
        유튜버: 2,
      },
    },
  })
  @Get('dream-jobs-accumulated')
  @Roles([Role.Student])
  async getDreamJobsAccumulated(@UUIDHeader() uuid: string): Promise<GetDreamJobsAccumulatedResponseDto> {
    const result = await this.userService.getDreamJobsAccumulated(uuid);

    return { dream_jobs: result };
  }

  @ApiOperation({
    summary: '학생의 상태를 업데이트하는 API입니다. 작업자: 강현길',
    description: `학생의 상태를 업데이트하는 API입니다.\n 각 피지컬, 멘탈 상태는 1-5 범위의 값으로 주시면 됩니다.\n 누적 방식이기 때문에 변동이 없는 데이터는 이전과 동일하게 넣어서 주시면 됩니다. 상태 메시지가 없는 경우 빈 문자열이라도 넣어서 보내주시면 됩니다.`,
  })
  @Post('status')
  @Roles([Role.Student])
  async updateUserStatus(@UUIDHeader() uuid: string, @Body() dto: PostUserStatusDto) {
    return await this.userService.updateUserStatus(uuid, dto);
  }

  @ApiOperation({
    summary: '학생의 최근 상태를 조회하는 API입니다. 작업자: 강현길',
    description:
      '최근 3개 데이터를 기준으로 데이터를 반환합니다. 데이터가 없는 경우에는 빈 배열과 빈 문자열이 반환됩니다.\n멘탈과 피지컬 상태의 배열은 최신순입니다.',
  })
  @Get('status/recent')
  @Roles([Role.Student])
  @ApiResponse({
    status: 200,
    description: 'user_status_message, mental_states, physical_states',
    schema: {
      example: {
        statusMessage: 'test',
        mentalStates: [5, 4, 3],
        physicalStates: [4, 5, 2],
      },
    },
  })
  async getRecentUserStatus(@UUIDHeader() uuid: string): Promise<GetRecentUserStatusResponseDto | null> {
    const result = await this.userService.getRecentUserStatus(uuid);
    if (!result) return null;
    return {
      statusMessage: result.statusMessage ?? '',
      mentalStates: result.mentalStates ?? [],
      physicalStates: result.physicalStates ?? [],
      dreamJobs: result.dreamJobs ?? [],
    };
  }
}
