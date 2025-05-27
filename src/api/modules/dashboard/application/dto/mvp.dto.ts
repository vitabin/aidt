import { ApiProperty } from '@nestjs/swagger';

export class MvpDto {
  @ApiProperty({ description: '질문답변 상위 5인. 왼쪽부터 1~5위' })
  QnA!: string[];

  @ApiProperty({ description: 'sns활동 상위 5인. 왼쪽부터 1~5위' })
  SNS!: string[];

  @ApiProperty({ description: '정답률 상위 5인. 왼쪽부터 1~5위' })
  CorrectRate!: string[];

  @ApiProperty({ description: '문제풀이 상위 5인. 왼쪽부터 1~5위' })
  NumSolve!: string[];
}
