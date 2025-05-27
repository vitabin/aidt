/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiAcceptedResponse, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
import { AnnouncementService } from '../application';
import { UUIDHeader } from 'src/libs/decorators/uuidHeader.decorator';
import { classInfoHeaderDesc, SchoolClassHeader } from 'src/libs/decorators/school-class-header.decorator';
import { AnnouncementDto, AnnouncementList, CreateAnnouncement, CreateCommentDto, CreateLikeDto } from '../application/dto';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { Roles } from 'src/libs/decorators/roles.decorator';
import { Role } from 'src/libs/decorators/role.enum';
import { AnnouncementEntity } from '../infrastructure';

@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('announcement')
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Controller({ path: 'announcement', version: ['1'] })
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @ApiOperation({
    summary: '공지사항 생성',
    description: `
    작성자의 uuid, classInfo, role을 헤더로 post data를 body로 받습니다.
    작업자: 최현빈_vitabin 24.07.10`,
  })
  @ApiCreatedResponse({ type: AnnouncementEntity })
  @HttpCode(HttpStatus.CREATED)
  @Roles([Role.Teacher])
  @ApiHeader(classInfoHeaderDesc)
  @Post('create')
  async createAnnouncement(
    @UUIDHeader() uuid: string,
    @SchoolClassHeader() classInfo: ClassInfo,
    @Body() data: CreateAnnouncement,
    @Headers('role') role: Role,
  ) {
    return await this.announcementService.createAnnouncement(uuid, classInfo, data, role);
  }

  @ApiOperation({
    summary: '공지사항 좋아요 생성 (왕정희)',
    description: `
    공지사항 또는 공지사항의 댓글의 좋아요를 생성.\n
    DTO의 commentId 를 비워두면, 공지사항에 좋아요를 하고,\n
    commentId 를 넣으면, 해당 댓글에 좋아요를 합니다.\n
    작업자: 왕정희 24.07.31`,
  })
  @ApiHeader(classInfoHeaderDesc)
  @HttpCode(HttpStatus.CREATED)
  @Post('like')
  async likeAnnouncement(@UUIDHeader() uuid: string, @SchoolClassHeader() classInfo: ClassInfo, @Body() data: CreateLikeDto, @Headers('role') role: Role) {
    return await this.announcementService.createLike(uuid, data);
  }

  @ApiOperation({
    summary: '공지사항 리스트 조회',
    description: `
    class-info와 role을 헤더로 받습니다.
    작업자: 최현빈_vitibin 24.07.11
    `,
  })
  @ApiOkResponse({ type: [AnnouncementList] })
  @ApiHeader(classInfoHeaderDesc)
  @HttpCode(HttpStatus.OK)
  @Get('board')
  async searchAnnouncement(@Headers('Role') role: Role, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.announcementService.searchAnnouncement(role, classInfo);
  }

  @ApiOperation({
    summary: '공지사항 상세 조회',
    description: `
    공지사항ID를 URL Param으로 classInfo를 헤더로 받습니다.
    작업자: 최현빈_vitibin 24.07.11
    `,
  })
  @ApiHeader(classInfoHeaderDesc)
  @ApiOkResponse({ type: AnnouncementDto })
  @HttpCode(HttpStatus.OK)
  @Get('detail/:id')
  async announcementDetail(@Param('id') id: number, @SchoolClassHeader() classInfo: ClassInfo, @UUIDHeader() uuid: string) {
    return await this.announcementService.getDetail(id, classInfo, uuid);
  }

  @ApiOperation({
    summary: '공지사항 삭제',
    description: `
    공지사항ID를 URL Param으로 uuid와 role을 헤더로 받습니다.
    작업자: 최현빈_vitabin 20.07.11`,
  })
  @ApiAcceptedResponse({ type: AnnouncementEntity })
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles([Role.Teacher])
  @Delete('delete/:id')
  async deleteAnnouncement(@Param('id') id: number, @UUIDHeader() uuid: string) {
    return await this.announcementService.deleteAnnouncement(id, uuid);
  }

  @ApiOperation({
    summary: '공지사항 수정',
    description: `
    공지사항ID를 URL Param으로 uuid를 헤더, 수정사항 data를 Body로 받습니다.
    작업자: 최현빈_vitabin 24.07.11
    `,
  })
  @ApiAcceptedResponse({ type: AnnouncementDto })
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch('patch/:id')
  async patchAnnouncement(@Param('id') id: number, @UUIDHeader() uuid: string, @Body() data: CreateAnnouncement, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.announcementService.patchAnnouncement(id, uuid, data, classInfo);
  }

  @ApiOperation({
    summary: '공지사항 댓글 생성',
    description: `
    유저의 uuid를 haeder로, 공지사항ID, 댓글 데이터를 body로 받습니다.
    작업자: 최현빈_vitabin 24.07.24`,
  })
  @ApiCreatedResponse({ type: AnnouncementDto })
  @HttpCode(HttpStatus.CREATED)
  @Post('comment/create')
  async createComment(@UUIDHeader() uuid: string, @Body() createComment: CreateCommentDto, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.announcementService.createComment(uuid, createComment, classInfo);
  }

  @ApiOperation({
    summary: '공지사항 댓글 삭제',
    description: `
    uuid, classInfo를 haeder로, 댓글ID를 param으로 받습니다.
    작업자: 최현빈_vitabin 24.07.24`,
  })
  @ApiAcceptedResponse({ type: AnnouncementDto })
  @HttpCode(HttpStatus.ACCEPTED)
  @Delete('comment/delete/:id')
  async deleteComment(@UUIDHeader() uuid: string, @Param('id') id: number, @SchoolClassHeader() classInfo: ClassInfo) {
    return await this.announcementService.deleteComment(uuid, id, classInfo);
  }

  @ApiOperation({
    summary: '공지사항 댓글 삭제',
    description: `
    uuid, classInfo를 haeder로, 댓글ID를 param으로 받습니다.
    작업자: 최현빈_vitabin 24.07.24`,
  })
  @ApiAcceptedResponse({ type: AnnouncementDto })
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch('comment/patch/:id')
  async patchComment(@UUIDHeader() uuid: string, @Param('id') id: number, @SchoolClassHeader() classInfo: ClassInfo) {
    return;
  }
}
