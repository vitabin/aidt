import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateConceptCompleteDto {
  @ApiProperty({ description: '개념 ID' })
  @IsNumber()
  conceptId!: number;

  @ApiProperty({ description: '서비스 학습체계 ID' })
  @IsNumber()
  learningSysId!: number;
}
