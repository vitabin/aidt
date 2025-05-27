import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetUnitAssessmentDto {
  @ApiProperty({ description: '대단원의 표준학습체계 ID를 넣어주시면 됩니다.' })
  @IsString()
  curriculumId!: string;
}
