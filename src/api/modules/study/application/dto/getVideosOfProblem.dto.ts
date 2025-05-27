import { IsNumber, IsOptional } from 'class-validator';

export class GetVideosOfProblemDto {
  @IsNumber()
  problemId!: number;
  @IsNumber()
  studyId!: number;
  @IsNumber()
  @IsOptional()
  pageSize: number = 1;
  @IsNumber()
  @IsOptional()
  page: number = 1;
}
