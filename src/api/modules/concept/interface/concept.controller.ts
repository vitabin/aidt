import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Patch, Post, Query, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { ConceptService } from '../application';
import {
  CreateCommonConcpetVidPlayDto,
  CreateConceptCompleteDto,
  GetConceptDto,
  GetConceptLikeMineDto,
  UpdateCommonConcpetVidPlayDto,
} from '../application/dto';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('concept')
@Controller({ path: 'concept', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class ConceptController {
  constructor(private readonly conceptService: ConceptService) {}

  @ApiOperation({
    summary: 'cls_id로 common_concept를 가져온다. (작업자 : 왕정희, 구성모)',
    description: `\n
    cls_id(소단원 아이디)로 common_concept 한개 및 해당 common_concept에 연관된 common_concept_video (공통 인강)를 가져옵니다.`,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'DB common_concept 테이블의 한개의 row 데이터를 반환합니다.',
    schema: {
      example: {
        id: 1,
        type: 'BASIC',
        type_name: 'BASIC',
        latex_data: 'LATEX',
        created_by: 1,
        cls_id: '학습체계 아이디',
        content_status: 'ACTIVATED',
        is_algeomath: 1,
        order_no: 1,
        updated_at: '2021-08-31T07:00:00.000Z',
        common_concept_video: {
          id: 1,
          common_concept_id: 1,
          video_path: '비디오 경로',
          subtitle_path: '자막 경로',
          sign_video_path: 'SIGN 영상 경로',
          status: 'IDLE|PROCESSING|DONE|ERROR',
          created_by: 1,
          commentary: 'COMMENTARY',
          title: '제목',
          created_at: '2021-08-31T07:00:00.000Z',
          deleted_at: null,
        },
      },
    },
  })
  @Get('common-concept')
  async getCommonConcept(@Query() dto: GetConceptDto) {
    return await this.conceptService.getCommonConcept(dto);
  }

  @ApiOperation({
    summary: '공통인강 시청 시작 시간 등록',
    description: `
    공통인강 누적 시청여부를 위한 Api
    영상 플레이 시작 시 호출하여 주세요
    작업자: 최현빈_vitabin 24.06.30
    `,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    schema: {
      example: {
        id: 1,
        common_concept_video_id: 1,
        user_uuid: 'test',
        created_at: '2021-08-31T07:00:00.000Z',
      },
    },
  })
  @Post('common-concept/play')
  async createCommonConceptVidPlay(@Body() createCommonConcpetVidPlay: CreateCommonConcpetVidPlayDto, @Headers('uuid') uuid: string) {
    return await this.conceptService.createCommonConcpetVidPlay(createCommonConcpetVidPlay, uuid);
  }

  @ApiOperation({
    summary: '공통인강 시청 종료 시간 등록',
    description: `
    공통인강 누적 시청여부를 위한 Api
    영상 플레이 종료 시 호출하여 주세요
    작업자: 최현빈_vitabin 24.06.30
    `,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    schema: {
      example: {
        id: 1,
        common_concept_video_id: 1,
        user_uuid: 'test',
        created_at: '2021-08-31T07:00:00.000Z',
        ended_at: '2021-08-31T07:30:00.000Z',
      },
    },
  })
  @Patch('common-concept/end')
  async updateCommonConcpetVidPlay(@Body() updateCommonConcpetVidPlay: UpdateCommonConcpetVidPlayDto, @Headers('uuid') uuid: string) {
    return await this.conceptService.updateCommonConcpetVidPlay(updateCommonConcpetVidPlay, uuid);
  }

  @ApiOperation({
    summary: '개념 학습 완료 기능',
    description: `
    개념학습을 사용자가 개념학습 완료 버튼을 누를시 호출 필요
    작업자: 구성모
    `,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    schema: {
      example: {
        id: 1,
        concept_id: 1,
        user_uuid: 'd47b4847-b96b-5328-a9dd-ad78cea3c4b6',
        created_at: '2024-06-26 04:00:24',
        updated_at: '2024-06-26 04:00:24',
      },
    },
  })
  @Post('concept-complete')
  async insertConceptStudyComplete(@Body() createConceptCompleteDto: CreateConceptCompleteDto, @Headers('uuid') uuid: string) {
    return await this.conceptService.insertConceptStudyComplete(createConceptCompleteDto, uuid);
  }

  @ApiOperation({
    summary: '개념영상 id로 좋아요 유무를 가져온다. (작업자 : 구성모)',
    description: `\n
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'common_concept 영상에 대해서 좋아요 유무를 true/false로 반환.',
    schema: {
      example: { like: true },
    },
  })
  @Get('common-concept-like-mine')
  async getCommonConceptLikeMine(@Query() dto: GetConceptLikeMineDto, @Headers('uuid') uuid: string) {
    return await this.conceptService.getCommonConceptLikeMine(dto, uuid);
  }
}
