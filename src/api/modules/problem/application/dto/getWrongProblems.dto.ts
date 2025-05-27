import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { EProblemDifficulty } from '../../infrastructure/problem.difficulty.enum';
import { Difficulty, StudyType } from '@prisma/client';
export class GetWrongProblemsDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: '오답 문제를 가져올 learning_sys_id',
  })
  learning_sys_id!: number;

  @IsEnum(Difficulty, { message: 'difficulty는 LOW, MIDDLE, HIGH, HIGHEST 중 하나의 값이어야 합니다.' })
  @IsOptional()
  @ApiProperty({
    description: '문제의 난이도(선택), LOW, MIDDLE, HIGH, HIGHEST 중 하나를 적어주세요. 없으면 난이도 관계 없이 불러옵니다.',
    enum: Difficulty,
  })
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(StudyType, { message: 'studyType는 BASIC,CONFIRM,FEEDBACK,ADDITIONAL 중 하나의 값이어야 합니다.' })
  @ApiProperty({
    description: '학습 유형(선택), BASIC,CONFIRM,FEEDBACK,ADDITIONAL 중 하나를 적어주세요. 없으면 학습 유형에 관계 없이 불러옵니다.',
    enum: EProblemDifficulty,
  })
  studyType?: StudyType;

  private validate(): void {}
}
