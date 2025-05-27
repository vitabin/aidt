import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class StudentStudyDurationDto {
  @IsString()
  chapterName!: string;

  @IsNumber()
  learningMapNodeId!: number;

  @IsNumber()
  @ApiProperty({ description: '학생의 학습 시간을 초 단위로 반환합니다.' })
  studyDuration!: number;

  private validate(): void {}
}
