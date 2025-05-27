import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentForConceptDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
