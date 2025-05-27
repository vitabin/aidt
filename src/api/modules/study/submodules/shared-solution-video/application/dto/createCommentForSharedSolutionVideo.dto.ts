import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentForSharedSolutionVideoDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
