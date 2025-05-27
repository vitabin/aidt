import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementType, announcement_content } from '@prisma/client';

export class AnnouncementList {
  @ApiProperty({ description: '공지사항 ID' })
  id!: number;

  @ApiProperty({ description: '공지사항 제목' })
  title!: string;

  @ApiProperty({ description: '등록일' })
  createdAt!: Date;

  @ApiProperty({ description: '조회수' })
  view_count!: number;

  @ApiProperty({ description: '댓글 수' })
  comment_count!: number;

  @ApiProperty({ description: '공지사항 타입'})
  type!: AnnouncementType;

  static of(announcement: announcement_content) {
    const dto = new AnnouncementList();
    dto.id = announcement.id;
    dto.view_count = announcement.view_count;
    dto.title = announcement.title;
    dto.createdAt = announcement.created_at;
    dto.type = announcement.type!;
    return dto;
  }
}
