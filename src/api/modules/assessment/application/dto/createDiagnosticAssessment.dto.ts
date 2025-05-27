import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';
import { IsDate, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDiagnosticAssessmentDto {
  @IsNumber()
  @ApiProperty({
    description: '시험 시간을 초 단위로 입력합니다.',
  })
  @IsOptional()
  durationInSecond: number = 2400;

  @IsOptional()
  @IsDate()
  @ApiProperty({ description: '시험 시작시간입니다. 기본값으로 현재 시각이 입력됩니다.' })
  beginAt: Date = new Date();

  @IsEnum(AssessmentType)
  @ApiProperty({ description: 'DIAGNOSTIC : 학력진단평가 / UNIT.00 : 대단원형성평가,learningSysId / COMPREHENSIVE : 학기 총괄평가' })
  type: AssessmentType = AssessmentType.DIAGNOSTIC;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: '대단원 형성평가의 경우에만 학습시스템 아이디를 넣어주세요.' })
  learning_sys_id?: number;
}
