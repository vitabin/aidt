import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class GetAssessmentResultDto {
  @IsNumber()
  @ApiProperty({ description: 'Assessment ID' })
  @Min(1)
  assessment_id!: number;
}
