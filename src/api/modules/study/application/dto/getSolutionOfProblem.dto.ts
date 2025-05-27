import { IsNumber } from 'class-validator';

export class GetSolutionOfProblemDto {
  @IsNumber()
  problemId!: number;
  @IsNumber()
  studyId!: number;
}
