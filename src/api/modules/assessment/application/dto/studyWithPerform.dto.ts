import { ApiProperty } from '@nestjs/swagger';
import { problem, study_perform } from '@prisma/client';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class StudyWithPerform {
  @IsNotEmpty()
  @ApiProperty()
  problem!: problem;

  @ApiProperty()
  @IsOptional()
  myPerform?: study_perform;
}
