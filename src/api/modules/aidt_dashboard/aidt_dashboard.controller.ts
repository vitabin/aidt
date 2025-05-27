import { Body, Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { HistoryService } from 'src/history/history.service';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
import { SendScoreOfCurriculumDto } from '../study';
import { AidtDashboardService } from './aidt_dashboard.service';

@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('aidt-dashboard')
@Controller('aidt-dashboard')
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class AidtDashboardController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly aidtDashboardService: AidtDashboardService,
  ) {}
  @ApiOperation({
    summary: '공공API /aidt_dashboard/initialized 를 호출하실 때 같이 호출하실 API입니다.',
    description: '학습시간을 기록하기 위해 만들었습니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        curriculumId: {
          type: 'string',
        },
      },
    },
  })
  @Post('initialized')
  async recordInitialization(@UUIDHeader() uuid: string, @Body('curriculumId') curriculumId: string) {
    await this.historyService.writeSigninRecord(uuid, curriculumId);
  }

  @ApiOperation({
    summary: '공공API /aidt_dashboard/terminated 를 실행하실 때 같이 실행하실 API입니다.',
    description: '학습시간을 기록하기 위해 만들었습니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        curriculumId: {
          type: 'string',
        },
      },
    },
  })
  @Post('terminated')
  async recordTermination(@UUIDHeader() uuid: string, @Body('curriculumId') curriculumId: string) {
    await this.historyService.writeSignoutRecord(uuid, curriculumId);
  }

  @ApiOperation({
    summary: '한 표준학습체계의 학습이 완료된 후 해당 학습체계의 점수를 전송하는 API입니다. 작업자: 강현길',
  })
  @Post('curriculum_score')
  async sendScoreOfCurriculum(@Body() dto: SendScoreOfCurriculumDto, @UUIDHeader() uuid: string) {
    return await this.aidtDashboardService.sendScoreOfCurriculum(dto, uuid);
  }
}
