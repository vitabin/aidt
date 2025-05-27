import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class GetAssignmentProblemsResultDto {
  @ApiProperty({ description: 'assignment_gave_id' })
  @IsNumber()
  @Min(1)
  assignment_gave_id!: number;
}
