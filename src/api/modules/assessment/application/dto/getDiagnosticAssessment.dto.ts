import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, Min } from 'class-validator';

export class GetDiagnosticAssessmentDto {
  @IsBoolean()
  @Transform((value) => {
    return value.obj.containingProblemsPreview === 'true';
  })
  @ApiProperty({ description: '미리보기용 문제를 포함할지 안 할지 정합니다.\n학생이면 이 매개변수의 여부와 상관 없이 문제는 보이지 않습니다.' })
  containingProblemsPreview: boolean = false;

  @IsEnum(AssessmentType)
  @ApiProperty({ description: 'DIAGNOSTIC : 학력진단평가 / UNIT.00 : 대단원형성평가,learningSysId / COMPREHENSIVE : 학기 총괄평가' })
  type: AssessmentType = AssessmentType.DIAGNOSTIC;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: '대단원 형성평가의 경우에만 학습시스템 아이디를 넣어주세요.' })
  learning_sys_id?: number;
}
