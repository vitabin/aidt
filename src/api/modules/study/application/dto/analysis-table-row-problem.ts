import { ApiProperty } from '@nestjs/swagger';
import { ProblemType } from '@prisma/client';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { EDifficulty } from 'src/api/modules/problem';

export class AnalysisTableRowProblem {
  @IsNumber()
  is_correct!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  confidence!: number;

  @ApiProperty()
  @IsEnum(EDifficulty.values().map((v) => v.code))
  difficulty!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  study_perform_id!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  study_problem_id!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  problem_id!: number;

  @ApiProperty()
  @IsEnum(ProblemType)
  problem_type!: ProblemType;

  private validate(): void {}
}
