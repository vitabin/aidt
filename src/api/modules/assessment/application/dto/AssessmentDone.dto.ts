import { ApiProperty } from '@nestjs/swagger';
import { assessment_problem, learning_sys, problem } from '@prisma/client';
import { IsNumber, Max, Min } from 'class-validator';

export type problemWithLearningSys = problem & { learning_sys?: learning_sys };
export class AssessmentDoneDto {
  @ApiProperty({ description: '내 점수' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiProperty({ description: '반 평균 점수' })
  @IsNumber()
  @Min(0)
  @Max(100)
  averageScore!: number;

  @ApiProperty({ description: '내 학습 단계' })
  @IsNumber()
  @Min(0)
  @Max(10)
  achievementLevel!: number;

  @ApiProperty({ description: '내가 푼 문제' })
  problems!: problemWithLearningSys[];

  @ApiProperty({ description: '나의 채점 결과 배열' })
  performs!: assessment_problem[];
}
