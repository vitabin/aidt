import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { AssessmentPerformSubmission } from './assessmentPerformSubmission';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAnswerOfAssessmentPerformDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AssessmentPerformSubmission)
  @ApiProperty({ type: [AssessmentPerformSubmission] })
  submissions!: AssessmentPerformSubmission[];

  private validate(): void {}
}
