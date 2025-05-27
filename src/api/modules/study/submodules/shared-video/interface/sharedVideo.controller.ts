import { Controller, Get, Query, Patch, HttpCode, HttpStatus, Body, Param, Post, Delete, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SchoolClassHeader, classInfoHeaderDesc } from 'src/libs/decorators/school-class-header.decorator';
import {
  CreateCommentForConceptDto,
  CreateSharedVideoForConceptDto,
  GetCommentsForConceptDto,
  GetCommentsForConceptResponseDto,
  GetSharedVideoForConceptDto,
  LikeSharedVideoDto,
  LikeSharedVideoResponseDto,
  PinSharedVideoOnTopDto,
  UpdateCommentForConceptDto,
} from '../application/dto';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { StudyService } from '../../../application';
import { CommentEntity } from '../infrastructure/comment.entity';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('study')
@Controller('shared-video')
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class SharedVideoController {
  constructor(private studyService: StudyService) {}
  @ApiOperation({
    summary: '해당 소단원의 개념 공유영상을 조회하는 API입니다.',
    description: `해당 소단원의 개념 공유영상을 조회하는 API입니다.
   단원 ID, 페이지 수를 받아 조회 가능한 scope에 있는 공유영상들을 조회합니다. 작업자: 강현길`,
  })
  // eslint-disable-next-line sonarjs/no-duplicate-string
  @ApiHeader(classInfoHeaderDesc)
  @Get()
  async getSharedVideoForConcept(@Query() dto: GetSharedVideoForConceptDto, @UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.studyService.getSharedVideoForConcept(dto, uuid, classInfo);
  }

  @ApiOperation({
    summary: '개념 공유 영상의 상단 고정 여부를 업데이트 하는 API입니다.',
    description: `개념 영상의 상단 고정 여부를 업데이트 하는 API입니다.
  학급 ID, 단원 ID, 상단 고정 여부를 받아 고정 여부를 업데이트합니다. 작업자: 강현길`,
  })
  @ApiHeader(classInfoHeaderDesc)
  @Patch(':videoId/pin')
  @HttpCode(HttpStatus.ACCEPTED)
  async pinSharedVideoOnTop(@Body() dto: PinSharedVideoOnTopDto, @Param('videoId') videoId: number, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.studyService.pinSharedVideoOnTop(dto, classInfo, videoId);
  }

  @ApiOperation({
    summary: '개념 공유 영상의 조회수를 올리는 API입니다. 작업자: 강현길',
  })
  @Patch(':videoId/view')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader(classInfoHeaderDesc)
  async viewSharedVideo(@Param('video-id') videoId: number, @UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.studyService.increaseViewCountForSharedVideo(videoId, uuid, classInfo);
  }

  @ApiOperation({
    summary: '해당 소단원의 개념 공유영상을 올리는 API입니다.',
    description: `해당 소단원의 개념 공유영상을 올리는 API입니다.
    단원 ID, 학급 ID, 영상 S3 경로, 공유 범위를 받아 개념 공유영상을 생성합니다.
    이때 concept_video_share도 같이 생성되어 공유 범위를 관리합니다. 작업자: 강현길`,
  })
  @ApiHeader(classInfoHeaderDesc)
  @Post()
  async createSharedVideoForConcept(@Body() dto: CreateSharedVideoForConceptDto, @UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.studyService.createSharedVideoForConcept(dto, uuid, classInfo);
  }

  @ApiOperation({
    summary: '해당 개념 공유 영상을 삭제하는 API입니다.',
    description: `해당 개념 공유 영상을 삭제하는 API입니다.
    오직 작성자만이 영상을 삭제할 수 있습니다. 작업자: 강현길`,
  })
  @Delete(':videoId')
  async deleteSharedVideoForConcept(@Param('videoId') videoId: number, @UUIDHeader() uuid: string) {
    return await this.studyService.deleteSharedVideoForConcept(uuid, videoId);
  }

  @ApiOperation({
    summary: '해당 영상에 댓글을 생성하는 API입니다.',
    description: `해당 영상에 댓글을 생성하는 API입니다.
    댓글 내용을 받아 해당 영상에 댓글를 생성합니다.
    만약 해당 영상이 존재하지 않는다면 예외를 던집니다. 작업자: 강현길`,
  })
  @Post(':videoId/comment')
  async createCommentForConcept(
    @Body() dto: CreateCommentForConceptDto,
    @Param('videoId') videoId: number,
    @UUIDHeader() uuid: string,
  ): Promise<CommentEntity> {
    return await this.studyService.createCommentForConcept(dto, uuid, videoId);
  }

  @ApiOperation({
    summary: '해당 댓글을 수정하는 API입니다.',
    description: `해당 댓글을 수정하는 API입니다.
    오직 작성자만이 수정할 수 있습니다. 작업자: 강현길`,
  })
  @Patch('comments/:commentId')
  async updateCommentForConcept(@Body() dto: UpdateCommentForConceptDto, @Param('commentId') commentId: number, @UUIDHeader() uuid: string) {
    return await this.studyService.updateCommentForConcept(dto, uuid, commentId);
  }

  @ApiOperation({
    summary: '해당 댓글을 삭제하는 API입니다.',
    description: `해당 댓글을 삭제하는 API입니다.
    오직 작성자만이 삭제할 수 있습니다. 작업자: 강현길`,
  })
  @Delete('comments/:commentId')
  async deleteCommentForConcept(@Param('commentId') commentId: number, @UUIDHeader() uuid: string) {
    return await this.studyService.deleteCommentForConcept(uuid, commentId);
  }

  @ApiOperation({
    summary: '개념 공유 영상에 댓글을 조회하는 API입니다. 작업자: 강현길',
    description: `개념 공유 영상에 댓글을 조회하는 API입니다.`,
  })
  @Get(':videoId/comments')
  async getCommentsForConcept(@Param('videoId') videoId: number, @Query() dto: GetCommentsForConceptDto): Promise<GetCommentsForConceptResponseDto> {
    const result = await this.studyService.getCommentsForConcept(videoId, dto);

    return {
      currentPage: result.currentPage,
      totalPage: result.totalPage,
      comments: result.comments.map((comment) => {
        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          uuid: comment.user_uuid,
        };
      }),
    };
  }

  @ApiOperation({
    summary: '개념 공유 영상의 좋아요/좋아요 해제를 하는 API입니다.',
    description: `개념 공유 영상의 좋아요/좋아요 해제를 하는 API입니다.
  좋아요나 좋아요 해제를 중복해서 하거나 해당 공유영상이 존재하지 않으면 예외를 던집니다.
    `,
  })
  @Post('like')
  @HttpCode(HttpStatus.ACCEPTED)
  async likeSharedVideo(@Body() dto: LikeSharedVideoDto, @UUIDHeader() uuid: string): Promise<LikeSharedVideoResponseDto> {
    return await this.studyService.likeSharedVideo(dto, uuid);
  }
}
