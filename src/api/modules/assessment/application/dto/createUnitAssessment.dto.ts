import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class CreateUnitAssessmentDto {
  @IsString()
  @Length(8, 8)
  @IsNotEmpty()
  @ApiProperty({
    description: '형성평가를 출제할 대단원의 표준학습체계 ID를 넣어주시면 됩니다.',
    example: 'E4MATA02',
  })
  curriculumId!: string;

  @IsNumber()
  @Min(1)
  durationInSecond!: number;
}
