import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiProperty({ description: '유저가 제출한 정답' })
  @IsString()
  answer!: string;

  @ApiProperty({ description: '자신감' })
  @IsNumber()
  confidence!: number;

  @ApiProperty({ description: '과제 문제 ID' })
  @IsNumber()
  problemId!: number;

  @ApiProperty({ description: '과제 ID' })
  @IsNumber()
  assignmentId!: number;
}
