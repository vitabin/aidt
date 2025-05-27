import { IsNumber } from 'class-validator';

export class UpdateAnswerOfAssessmentPerformResponseDto {
  @IsNumber({}, { each: true })
  updatedIds!: number[];
}
