import { Body, Controller, Delete, Post, Query, Get, Patch, Param, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SchoolClassHeader, classInfoHeaderDesc } from 'src/libs/decorators/school-class-header.decorator';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import {
  CreateAnswerDto,
  CreateAnswerResponseDto,
  CreateCommentForSharedSolutionVideoDto,
  EditCommentForSharedSolutionVideoDto,
  GetSharedSolutionVideoForConceptCommentDto,
  GetSharedSolutionVideoForConceptCommentResponseDto,
  GetSharedSolutionVideoForConceptDto,
  GetSharedSolutionVideoForConceptResponseDto,
} from '../application/dto';
import { SharedSolutionVideoService } from '../application/shared-solution-video.service';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { CommentEntity } from '../../../infrastructure';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { RoleHeader } from 'src/libs/decorators/roleHeader.decorator';
import { Role } from 'src/libs/decorators/role.enum';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('study')
@Controller('shared-solution-video')
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class SharedSolutionVideoController {
  constructor(private service: SharedSolutionVideoService) {}
  @ApiOperation({ summary: '풀이영상을 조회하는 API입니다. 작업자: 강현길' })
  @Get()
  @ApiHeader(classInfoHeaderDesc)
  async getSharedSolutionVideoForConcept(
    @Query() dto: GetSharedSolutionVideoForConceptDto,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<GetSharedSolutionVideoForConceptResponseDto> {
    const result = await this.service.getSharedSolutionVideoForConcept(dto, uuid, classInfo);

    return {
      totalPage: result.totalPageCount,
      page: dto.page,
      videos: result.videos.map((video) => {
        return {
          commentCount: video._count.shared_solution_video_comment,
          createdAt: video.created_at,
          haveILiked: video.shared_solution_video_like.length > 0,
          likeCount: video.shared_solution_video_data?.like_count ?? 0,
          videoPath: video.video_path,
          problemId: video.problem_id,
          userUuid: video.user_uuid,
          id: video.id,
          pinned: video.shared_solution_video_share?.pinned ?? false,
        };
      }),
    };
  }
  @ApiOperation({ summary: '풀이영상을 상단 고정하는 API입니다. 작업자: 강현길' })
  @ApiBody({
    schema: {
      example: {
        pin: true,
      },
    },
  })
  @Patch(':videoId')
  @ApiHeader(classInfoHeaderDesc)
  async pinSharedSolutionVideoOnTop(@Body('pin') pin: boolean, @Param('videoId') videoId: number, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.service.pinSharedSolutionVideoOnTop(videoId, pin, classInfo);
  }
  @ApiOperation({ summary: '풀이영상에 댓글을 다는 API입니다. 작업자: 강현길' })
  @Post(':videoId/comment')
  @ApiHeader(classInfoHeaderDesc)
  async createCommentForSharedSolutionVideo(
    @Body() dto: CreateCommentForSharedSolutionVideoDto,
    @Param('videoId') videoId: number,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<CommentEntity> {
    const result = await this.service.createCommentForSharedSolutionVideo(dto, videoId, uuid, classInfo);
    return {
      content: result.content,
      id: result.id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      uuid: result.user_uuid,
    };
  }
  @ApiOperation({ summary: '풀이영상을 댓글을 조회하는 API입니다. 작업자: 강현길' })
  @Get(':videoId/comment')
  async getCommentForSharedSolutionVideo(
    @Param('videoId') videoId: number,
    @Query() dto: GetSharedSolutionVideoForConceptCommentDto,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ): Promise<GetSharedSolutionVideoForConceptCommentResponseDto> {
    const result = await this.service.getCommentForSharedSolutionVideo(videoId, dto, uuid, classInfo);

    return {
      page: dto.page,
      totalPage: result.totalPage,
      comments: result.comments.map((comment) => {
        return {
          content: comment.content,
          created_at: comment.created_at,
          id: comment.id,
          updated_at: comment.updated_at,
          uuid: comment.user_uuid,
        };
      }),
    };
  }
  @ApiOperation({ summary: '풀이영상에 댓글을 수정하는 API입니다. 작업자: 강현길' })
  @Patch(':videoId/comment/:commentId')
  async editCommentForSharedSolutionVideo(
    @Body() dto: EditCommentForSharedSolutionVideoDto,
    @Param('videoId') videoId: number,
    @Param('commentId') commentId: number,
    @UUIDHeader() uuid: string,
  ) {
    return await this.service.editCommentForSharedSolutionVideo(dto, videoId, commentId, uuid);
  }
  @ApiOperation({ summary: '풀이영상에 댓글을 삭제하는 API입니다. 작업자: 강현길' })
  @Delete(':videoId/comment/:commentId')
  async deleteCommentForSharedSolutionVideo(@Param('videoId') videoId: number, @UUIDHeader() uuid: string, @Param('commentId') commentId: number) {
    return await this.service.deleteCommentForSharedSolutionVideo(videoId, commentId, uuid);
  }
  @ApiOperation({ summary: '풀이영상에 좋아요를 하는 API입니다. 작업자: 강현길' })
  @Post(':videoId/like')
  @ApiHeader(classInfoHeaderDesc)
  async likeSharedSolutionVideo(
    @Body('like') like: boolean,
    @Param('videoId') videoId: number,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
  ) {
    return await this.service.likeSharedSolutionVideo(videoId, like, uuid, classInfo);
  }

  @Delete(':id')
  @ApiOperation({ summary: '풀이영상을 삭제하는 API입니다. 작업자: 강현길' })
  async deleteAnswerForQuestion(@Param('id') id: number, @UUIDHeader() uuid: string): Promise<void> {
    await this.service.deleteAnswerForQuestion(id, uuid);
  }

  @ApiOperation({
    summary: '풀이 영상을 올리는 API입니다. 작업자: 강현길',
    description: `풀이 영상을 올리는 API입니다.\n
    문제 화면에서 바로 전자칠판을 사용한 경우에는 problemId만
    누군가의 질문에 대한 답변을 올리는 거라면 quetionId만 보내주시면 됩니다.`,
  })
  @Post()
  @ApiHeader(classInfoHeaderDesc)
  async putAnswerForQuestion(
    @Body() dto: CreateAnswerDto,
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
    @RoleHeader() role: Role,
  ): Promise<CreateAnswerResponseDto> {
    return await this.service.createSharedSolutionVideoForConcept(dto, uuid, classInfo, role);
  }
  @ApiOperation({ summary: '풀이 영상을 일시정지할 때마다 호출하는 API입니다. 작업자: 강현길' })
  @Patch(':id/pause-count')
  async pauseAnswerForQuestion(@Param('id') id: number): Promise<void> {
    await this.service.pauseAnswerForQuestion(id);
  }
  @ApiOperation({ summary: '답변 영상의 재생 시간을 기록하는 API입니다. 작업자: 강현길' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        timeInSecond: {
          type: 'number',
        },
      },
    },
  })
  @Patch(':id/play-time')
  async addPlayTimeForAnswer(@Param('id') id: number, @Body('timeInSecond') time: number): Promise<void> {
    await this.service.addPlayTimeForAnswer(id, time);
  }

  @ApiOperation({ summary: '풀이 영상의 재생버튼을 누를 때마다 호출하는 API입니다. 작업자: 강현길' })
  @Patch(':id/play-count')
  async addPlayCountForAnswer(@Param('id') id: number): Promise<void> {
    await this.service.addPlayCountForAnswer(id);
  }
}
