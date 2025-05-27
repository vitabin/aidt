import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentForConceptDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
