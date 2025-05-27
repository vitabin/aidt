import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '공지사항 ID' })
  @IsNumber()
  AnnouncementId!: number;

  @ApiProperty({ description: '댓글' })
  @IsString()
  comment!: string;
}
