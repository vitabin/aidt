import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { question, shared_solution_video, study_perform } from '@prisma/client';

export class AccumulateDto {
  @ApiProperty({ description: '나의 문제풀이 수' })
  @IsNumber()
  userSolved!: number;

  @ApiProperty({ description: '반평균 문제풀이 수' })
  @IsNumber()
  classSolved!: number;

  @ApiProperty({ description: '나의 정답률' })
  @IsNumber()
  userCorrectRate!: number;

  @ApiProperty({ description: '반평균 정답률' })
  @IsNumber()
  classCorrectRate!: number;

  @ApiProperty({ description: '나의 질의응답 수' })
  @IsNumber()
  userQnA!: number;

  @ApiProperty({ description: '반평균 질의응답 수' })
  @IsNumber()
  classQnA!: number;

  @ApiProperty({ description: '나의 좋아요 댓글 수' })
  @IsNumber()
  userCommentAndLike!: number;

  @ApiProperty({ description: '반평균 좋아요 댓글 수' })
  @IsNumber()
  classCommentAndLike!: number;

  static create(counts: {
    userStudyPerforms: study_perform[];
    classStudyPerforms: study_perform[];
    userQnAs: question[];
    classQnAs: question[];
    myActivity: number;
    meanActivity: number;
  }): AccumulateDto {
    const accumulateDto = new AccumulateDto();
    accumulateDto.userSolved = counts.userStudyPerforms.length;
    accumulateDto.classSolved = counts.classStudyPerforms.length;
    accumulateDto.userCorrectRate = counts.userStudyPerforms.filter((v) => v.is_correct === 1).length / counts.userStudyPerforms.length ;
    accumulateDto.classCorrectRate = counts.classStudyPerforms.filter((v) => v.is_correct === 1).length / counts.classStudyPerforms.length;
    accumulateDto.userQnA = counts.userQnAs.length;
    accumulateDto.classQnA = counts.classQnAs.length;
    accumulateDto.userCommentAndLike = counts.myActivity;
    accumulateDto.classCommentAndLike = counts.meanActivity;

    if (!accumulateDto.userCorrectRate || !accumulateDto.classCorrectRate) {
      accumulateDto.userCorrectRate = 0;
      accumulateDto.classCorrectRate = 0;
    }
    return accumulateDto;
  }

  static validate() {}
}
