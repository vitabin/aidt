import { ApiProperty } from '@nestjs/swagger';
import { study_perform } from '@prisma/client';

export class CorrectRate {
  @ApiProperty({ description: '해당 문제의 정답률' })
  correctRate!: number;

  static create(allPerforms: study_perform[]): CorrectRate {
    const dto = new CorrectRate();
    const correct = allPerforms.filter((v) => v.is_correct);
    dto.correctRate = (correct.length / allPerforms.length) * 100;

    return dto;
  }
}
