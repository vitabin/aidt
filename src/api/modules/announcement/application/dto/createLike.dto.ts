import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({ description: '공지사항 ID' })
  @IsNumber()
  announcementId!: number;

  @ApiProperty({ description: '공지사항 댓글 ID' })
  @IsNumber()
  @IsOptional()
  commentId?: number;
}
