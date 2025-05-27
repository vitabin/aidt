import { ApiProperty } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';
import { IsNumber, IsObject, IsString } from 'class-validator';

export class Results {
  @IsNumber()
  problemId!: number;

  @IsNumber()
  isCorrect!: number | null;

  @IsString()
  difficulty!: Difficulty;

  static create(problemId: number, difficulty: Difficulty, isCorrect: number | null) {
    const dto = new Results();
    dto.difficulty = difficulty;
    dto.isCorrect = isCorrect;
    dto.problemId = problemId;
    return dto;
  }
}
export class ResultBoardDto {
  @ApiProperty({ description: '학생의 uuid' })
  @IsString()
  userUuid!: string;

  @ApiProperty({ description: '학생별 학습 단계' })
  @IsNumber()
  achievmentLevel!: number;

  @ApiProperty({ description: '학생별 점수' })
  @IsNumber()
  score!: number;

  @ApiProperty({ description: '평가문제 풀이 이력 배열' })
  @IsObject()
  results!: Results[];

  @ApiProperty({ description: '과제ID , optional'})
  assignmentId?: number;

  @ApiProperty({ description: '학습ID , optional'})
  assessmentId?: number;

  static create(uuid: string, achievement_level: number, results: Results[]) {
    const dto = new ResultBoardDto();
    dto.achievmentLevel = achievement_level;
    dto.userUuid = uuid;
    dto.results = results;
    dto.score = (results.filter((v) => v.isCorrect === 1).length / results.length) * 100;
    return dto;
  }
}
