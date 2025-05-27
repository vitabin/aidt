import { IsNumber, Min } from 'class-validator';

export class CreateComprehensiveAssessmentDto {
  @IsNumber()
  @Min(1)
  durationInSecond!: number;
}
