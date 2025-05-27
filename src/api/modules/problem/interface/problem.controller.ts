import { Controller, HttpCode, HttpStatus, Get, Query, NotFoundException, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CorrectRate, GetByProblemIdDto, GetWrongProblemsDto, ProblemDto, ProblemService } from '../application';
import { GetProblemsFilterDto } from '../application';
import { problem } from '@prisma/client';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { GetConceptProblemDto } from '../application/dto/getConceptProblem.dto';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
import { StudyWithPerform } from '../../assessment/application/dto/studyWithPerform.dto';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('problem')
@Controller({ path: 'problem', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @ApiOperation({
    summary: 'ID로 문제 객체를 가져온다.',
    description: '연관된 study model도 함께 가져오므로 ai_hint,basic_video,commentary에 한번에 접근 가능한다.',
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  async getProblemById(@Query() dto: GetByProblemIdDto): Promise<problem> {
    const problem = await this.problemService.getProblemById(dto);
    if (!problem) throw new NotFoundException('문제를 찾을 수 없습니다.');
    return problem;
  }

  @ApiOperation({
    deprecated: true,
    summary: '[Deprecated] Problem ID로 Study model에 접근하여 commentary를 가져온다.',
  })
  @ApiOkResponse({
    description: 'Problem ID로 조회된 Study model이 여러개인 경우 첫번째(PK가 가장 낮은) Study model의 commentary를 반환.',
    schema: {
      example: {
        commentary: '문제 해설입니다.',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Get('commentary')
  async getCommentary(@Query() dto: GetByProblemIdDto) {
    return await this.problemService.getFromStudyRow(dto.id, 'id');
  }

  @ApiOperation({
    summary: '다양한 필터를 이용하여 문제 검색. 문제 은행은 GET /study/question-bank 를 이용해주세요.',
    description: 'curriculum, unitId, difficulty, answerType, deletedDate를 조합해 문제를 검색한다.',
  })
  @HttpCode(HttpStatus.OK)
  @Get('search')
  async getProblems(@Query() getProblemsFilter: GetProblemsFilterDto): Promise<problem[]> {
    return await this.problemService.getProblems(getProblemsFilter);
  }

  @ApiOperation({
    summary: 'Problem ID로 Study model에 접근하여 basic_video를 가져온다.',
    description: 'Problem ID로 조회된 Study model이 여러개인 경우 첫번째(PK가 가장 낮은) Study model의 basic_video를 가져온다. (작업자 왕정희)',
  })
  @HttpCode(HttpStatus.OK)
  @Get('video')
  @ApiOkResponse({
    description: '해당 Study row의 basic_video 정보를 반환',
    schema: {
      example: {
        basic_video: 'https://www.youtube.com/watch?v=123456',
      },
    },
  })
  async getBasicVideo(@Query() getByProblemIdDto: GetByProblemIdDto) {
    return await this.problemService.getFromStudyRow(getByProblemIdDto.id, 'basic_video');
  }

  // @ApiOperation({
  //   summary: 'Problem ID로 problem_solving Model에 접근하여 풀이 영상들을 가져온다.',
  //   description: '풀이 영상이 string array에 담겨서 반환된다.',
  // })
  // @HttpCode(HttpStatus.OK)
  // @Get('solving_videos')
  // async getSolvingVideos(@Query() getByProblemIdDto: GetByProblemIdDto, @UUIDHeader() uuid: string) {
  //   return await this.problemService.getFromSolvingRows(getByProblemIdDto, uuid, 'video_path');
  // }

  // @ApiOperation({
  //   summary: '학생이 문제 "다시풀기" 하였을 때 새로운 풀이 영상을 녹화한다면 해당 영상 주소를 업데이트한다.',
  //   description: 'uuid와 problem_id로 problem_solving Model에 있는 video_path를 업데이트하거나, 아직 없다면 새로 생성한다.',
  // })
  // @ApiOkResponse({
  //   description: '생성된 (또는 업데이트 된) problem_solving 객체를 반환',
  // })
  // @HttpCode(HttpStatus.OK)
  // @Put('update_solving_video')
  // async updateProblemSolvingVideo(@Query() updateProblemSolvingVideoDto: UpdateProblemSolvingVideoDto, @UUIDHeader() uuid: string) {
  //   return await this.problemService.updateProblemSolvingVideo(updateProblemSolvingVideoDto, uuid);
  // }

  @ApiOperation({
    summary: '대시보드에서 틀린 문제를 클릭하면 해당 문제를 다시 풀기 위한 문제들을 가져온다.',
    description: `learning_sys_id(필수)로 해당 소단원의 틀린 문제들을 가져온다.
    difficulty(선택)로 문제 난이도를 필터링하여 해당 난이도의 문제들만 가져올 수 있으며,
    type(선택)으로 문제 유형을 필터링하여 해당 유형의 문제들만 가져올 수 있다.
    작업자:왕정희
    `,
  })
  @ApiOkResponse({
    description: '틀린 문제의 problems 테이블 row 배열을 반환',
  })
  @HttpCode(HttpStatus.OK)
  @Get('wrong-problems')
  async getWrongProblems(@Query() dto: GetWrongProblemsDto, @UUIDHeader() uuid: string): Promise<Array<StudyWithPerform>> {
    return await this.problemService.getWrongProblems(dto, uuid);
  }

  @ApiOperation({
    summary: '학생 대시보드 개념학습 "전체"를 클릭해 풀이내역 조회',
    description: '작엽자: 최현빈_vitabin 24.06.28',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
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
          study_id: 1,
          study_perform: null,
        },
      ],
    },
  })
  @Get('studied-problems')
  async getStudiedProblems(@Query() getConceptProblemDto: GetConceptProblemDto, @UUIDHeader() uuid: string): Promise<ProblemDto[]> {
    return await this.problemService.getStudiedProblems(getConceptProblemDto, uuid);
  }

  @ApiOperation({
    summary: '문제 정답률 조회',
    description: `
    개념학습에서 출제된 문제만 정답률을 계산하여 리턴합니다.
    `,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: '해당 문제를 푼 내역이 없을 경우 null을 리턴합니다',
    schema: {
      example: {
        correctRate: 30,
      },
    },
  })
  @Get('correct-rate')
  async calculateCorrecRate(@Query('problemId') problemId: string): Promise<CorrectRate> {
    return await this.problemService.correcRate(Number(problemId));
  }
}
