import { AnnouncementType } from '@prisma/client';
import { Announcement } from '../../infrastructure';
import { AnnouncementCommentDto } from './announcementComment.dto';

export class AnnouncementDto {
  id!: number;

  uuid!: string;

  title!: string;

  content!: string;

  file_path: string[] = [];

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt?: Date | null;

  likes!: number;

  view_count: number = 1;

  type!: AnnouncementType | null;

  haveILiked!: boolean;

  comment!: AnnouncementCommentDto[];

  static create(announcement: Announcement, comment: AnnouncementCommentDto[], haveILiked = false) {
    const dto = new AnnouncementDto();
    dto.id = announcement.id;
    dto.uuid = announcement.uuid;
    dto.title = announcement.title;
    dto.content = announcement.content;
    dto.createdAt = announcement.created_at;
    dto.updatedAt = announcement.updated_at;
    dto.deletedAt = announcement.deleted_at;
    dto.likes = announcement._count.announcement_content_like;
    dto.view_count = announcement.view_count;
    dto.comment = comment;
    dto.type = announcement.type;
    dto.haveILiked = haveILiked;
    if (announcement.file_path) dto.file_path = announcement.file_path.split(',');

    return dto;
  }
}
