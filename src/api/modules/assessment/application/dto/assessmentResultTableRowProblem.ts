import { ApiProperty } from '@nestjs/swagger';
import { assessment_perform, learning_sys, problem } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, Min } from 'class-validator';
import { EDifficulty } from 'src/api/modules/problem';

export class AssessmentResultTableRowProblem {
  @ApiProperty()
  assessment_perform!: assessment_perform;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  assessment_problem_id!: number;

  @ApiProperty()
  problem!: problem;

  @ApiProperty()
  learning_sys!: learning_sys;

  @ApiProperty()
  @IsBoolean()
  @Transform((value) => {
    return value.obj.is_correct === 'true';
  })
  is_correct!: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  confidence!: number;

  @ApiProperty()
  @IsEnum(EDifficulty.values().map((v) => v.code))
  difficulty!: string;

  private validate(): void {}
}
