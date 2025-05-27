import { announcement_comment, announcement_content_like } from '@prisma/client';

export class AnnouncementCommentDto {
  id!: number;

  uuid!: string;

  comment_data!: string;

  createdAt!: Date;

  updatedAt!: Date;

  likes!: number;

  static created(comment: announcement_comment, likes: announcement_content_like[]) {
    const dto = new AnnouncementCommentDto();
    dto.id = comment.id;
    dto.uuid = comment.user_uuid;
    dto.comment_data = comment.comment_data;
    dto.createdAt = comment.created_at;
    dto.updatedAt = comment.updated_at;
    dto.likes = likes.length;

    return dto;
  }
}
