/* eslint-disable sonarjs/no-duplicate-string */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ClassInfo } from 'src/libs/dto/class-info.dto';
import { PrismaService } from 'src/prisma';
import { AnnouncementList, CreateAnnouncement, CreateCommentDto, CreateLikeDto } from './dto';
import { AnnouncementScope, AnnouncementType, announcement_content } from '@prisma/client';
import { Role } from 'src/libs/decorators/role.enum';
import { AnnouncementCommentDto } from './dto/announcementComment.dto';
import { AnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async createAnnouncement(uuid: string, classInfo: ClassInfo, data: CreateAnnouncement, role: Role): Promise<announcement_content> {
    if (role !== Role.Teacher) throw new ForbiddenException('공지사항을 작성할 권한이 없습니다.');

    const school = await this.prisma.school.findFirst({
      where: {
        school_id: classInfo.school_id,
      },
    });

    if (!school) throw new BadRequestException('잘못된 class-info입니다.');

    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        school_id: school.id,
        grade: classInfo.user_grade,
        class: classInfo.user_class,
      },
    });

    let filePath = '';
    if (data.filePath) data.filePath.forEach((v) => (filePath += `,${v}`));

    return await this.prisma.announcement_content.create({
      data: {
        uuid: uuid,
        school_class_id: schoolClass?.id,
        grade: classInfo.user_grade,
        file_path: filePath !== ',' ? filePath.slice(1) : '',
        type: data.type,
        scope: data.scope,
        title: data.title,
        content: data.content,
        updated_at: new Date(),
        view_count: 0,
      },
    });
  }

  async searchAnnouncement(role: Role, classInfo: ClassInfo): Promise<AnnouncementList[]> {
    const roles: AnnouncementScope[] = [];
    const school = await this.prisma.school.findFirst({
      where: {
        school_id: classInfo.school_id,
      },
    });

    if (!school) throw new BadRequestException('잘못된 class-info입니다.');

    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        school_id: school.id,
        grade: classInfo.user_grade,
        class: classInfo.user_class,
      },
    });

    if (!schoolClass) throw new NotFoundException('학급 정보를 찾을 수 없습니다.');

    //학부모 권한은 제거되었습니다.
    //if (role === Role.Parent) roles.push(...[AnnouncementScope.ALL, AnnouncementScope.PARENTS]);
    if (role === Role.Teacher) roles.push(...[AnnouncementScope.ALL, AnnouncementScope.PARENTS, AnnouncementScope.STUDENTS]);
    if (role === Role.Student) roles.push(...[AnnouncementScope.ALL, AnnouncementScope.STUDENTS]);

    const announcements = await this.prisma.announcement_content.findMany({
      where: {
        scope: {
          in: roles,
        },
        school_class_id: schoolClass.id,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        announcement_comment: true,
      },
    });
    return announcements.map((announcement) => {
      const dto = AnnouncementList.of(announcement);
      dto.comment_count = announcement.announcement_comment.length;
      return dto;
    });
  }

  async getDetail(id: number, classInfo: ClassInfo, userId: string) {
    const school = await this.prisma.school.findFirst({
      where: {
        school_id: classInfo.school_id,
      },
    });

    if (!school) throw new BadRequestException('잘못된 class-info입니다.');

    const schoolClass = await this.prisma.school_class.findFirst({
      where: {
        school_id: school.id,
        grade: classInfo.user_grade,
        class: classInfo.user_class,
      },
    });

    if (!schoolClass) throw new NotFoundException('학급 정보를 찾을 수 없습니다.');

    const announcement = await this.prisma.announcement_content.findFirst({
      include: {
        _count: {
          select: {
            announcement_content_like: {
              where: {
                announcement_content_id: id,
                announcement_commentId: null,
              },
            },
          },
        },
        announcement_content_like: {
          where: {
            user_uuid: userId,
          },
          select: {
            id: true,
          },
        },
      },
      where: {
        id: id,
      },
    });

    if (!announcement) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    if (announcement.school_class_id !== schoolClass.id) throw new ForbiddenException('해당 학급의 공지사항이 아닙니다.');

    await this.prisma.announcement_content.update({
      where: {
        id: announcement.id,
      },
      data: {
        view_count: announcement.view_count + 1,
      },
    });

    const comments = await this.prisma.announcement_comment.findMany({
      where: {
        announcement_id: announcement.id,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    const commentIds = comments.map((v) => v.id);
    const commentLikes = await this.prisma.announcement_content_like.findMany({
      where: {
        announcement_commentId: {
          in: commentIds,
        },
      },
    });

    const commentDtos = comments.map((v) => {
      const likes = commentLikes.filter((e) => e.announcement_commentId === v.id);
      return AnnouncementCommentDto.created(v, likes);
    });

    return AnnouncementDto.create(announcement, commentDtos, announcement.announcement_content_like.length > 0);
  }

  async deleteAnnouncement(id: number, uuid: string): Promise<announcement_content> {
    const announcement = await this.prisma.announcement_content.findFirst({ where: { id: id } });

    if (!announcement) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    if (uuid !== announcement.uuid) throw new ForbiddenException('공지사항을 삭제할 권한이 없습니다.');

    return await this.prisma.announcement_content.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async patchAnnouncement(id: number, uuid: string, data: CreateAnnouncement, classInfo: ClassInfo) {
    const announcement = await this.prisma.announcement_content.findFirst({ where: { id: id } });

    if (!announcement) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    if (announcement.uuid !== uuid) throw new ForbiddenException('공지사항을 수정할 권한이 없습니다.');

    let filePath = '';
    if (data.filePath) data.filePath.forEach((v) => (filePath += `,${v}`));

    await this.prisma.announcement_content.update({
      where: {
        id: announcement.id,
      },
      data: {
        title: data.title,
        file_path: filePath !== ',' ? filePath.slice(1) : '',
        content: data.content,
        scope: data.scope,
        type: data.type,
      },
    });

    return await this.getDetail(id, classInfo, uuid);
  }

  async createComment(uuid: string, createComment: CreateCommentDto, classInfo: ClassInfo) {
    const content = await this.prisma.announcement_content.findFirst({
      where: {
        id: createComment.AnnouncementId,
      },
    });
    if (!content) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    await this.prisma.announcement_comment.create({
      data: {
        announcement_id: content.id,
        user_uuid: uuid,
        comment_data: createComment.comment,
        updated_at: new Date(),
        created_at: new Date(),
      },
    });
    return this.getDetail(createComment.AnnouncementId, classInfo, uuid);
  }

  async deleteComment(uuid: string, id: number, classInfo: ClassInfo) {
    const comment = await this.prisma.announcement_comment.findFirst({
      where: {
        id: id,
      },
    });

    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.user_uuid !== uuid) throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');

    await this.prisma.announcement_comment.delete({
      where: {
        id: id,
      },
    });
    return await this.getDetail(comment.announcement_id, classInfo, uuid);
  }

  async patchComment(uuid: string, id: number, createComment: CreateCommentDto, classInfo: ClassInfo) {
    const comment = await this.prisma.announcement_comment.findFirst({
      where: {
        id: id,
      },
    });

    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.user_uuid !== uuid) throw new ForbiddenException('댓글을 수정할 권한이 없습니다.');

    await this.prisma.announcement_comment.update({
      where: {
        id: id,
      },
      data: {
        updated_at: new Date(),
        comment_data: createComment.comment,
      },
    });

    return await this.getDetail(createComment.AnnouncementId, classInfo, uuid);
  }

  async createLike(uuid: string, createLikeDto: CreateLikeDto) {
    const checkUser = await this.prisma.user.findFirst({
      where: {
        user_uuid: uuid,
      },
    });
    if (!checkUser) throw new NotFoundException('유저를 찾을 수 없습니다.');
    const alreadyLiked = await this.prisma.announcement_content_like.findFirst({
      where: {
        user_uuid: uuid,
        announcement_content_id: createLikeDto.announcementId,
        announcement_commentId: createLikeDto.commentId,
      },
    });
    if (alreadyLiked) throw new BadRequestException('이미 좋아요 처리 되었습니다.');

    return await this.prisma.announcement_content_like.create({
      data: {
        user_uuid: uuid,
        announcement_content_id: createLikeDto.announcementId,
        announcement_commentId: createLikeDto.commentId,
      },
    });
  }
}
