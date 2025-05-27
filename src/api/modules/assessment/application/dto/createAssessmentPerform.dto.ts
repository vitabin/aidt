import { IsNumber, Min } from 'class-validator';

export class CreateAssessmentPerformDto {
  @IsNumber()
  @Min(1)
  assessment_id!: number;

  @IsNumber()
  @Min(1)
  problem_id!: number;

  private validate(): void {}
}
