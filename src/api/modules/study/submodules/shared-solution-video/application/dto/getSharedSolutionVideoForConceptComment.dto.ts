import { IsNumber } from 'class-validator';

export class GetSharedSolutionVideoForConceptCommentDto {
  @IsNumber()
  page: number = 1;
  @IsNumber()
  pageSize: number = 10;
}
