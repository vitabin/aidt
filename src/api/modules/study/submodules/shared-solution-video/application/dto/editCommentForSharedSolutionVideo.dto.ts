import { IsNotEmpty, IsString } from 'class-validator';

export class EditCommentForSharedSolutionVideoDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
