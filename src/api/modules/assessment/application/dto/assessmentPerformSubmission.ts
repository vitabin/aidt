import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class AssessmentPerformSubmission {
  @IsNumber()
  @Min(1)
  @ApiProperty()
  assessment_id!: number;

  @IsNumber()
  @Min(1)
  @ApiProperty()
  problem_id!: number;

  @IsString()
  @ApiProperty()
  answer!: string;

  private validate(): void {}
}
