import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { Difficulty } from '@prisma/client';

export enum ProblemQuestionType {
  INFERIOR = 'INFERIOR',
  BASIC = 'BASIC',
  SIMILAR = 'SIMILAR',
  ADVANCED = 'ADVANCED',
}
export class GetQuestionBankDto {
  @ApiProperty()
  @IsNumber()
  learningSysId!: number;

  @ApiProperty()
  @IsNumber()
  problemId!: number;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @ApiProperty({ enum: ProblemQuestionType })
  @IsEnum(ProblemQuestionType)
  problemType!: ProblemQuestionType;

  private validate(): void {}
}
