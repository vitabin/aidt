import { IsString } from 'class-validator';

export class EditCommentForReferenceDataDto {
  @IsString()
  comment!: string;
}
