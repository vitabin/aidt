import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateOrUpdateStudyChapterPlanDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 1, description: '학기 ID. DB의 semester table을 참고하세요.' })
  semester_id!: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '단원ID' })
  learning_sys_id?: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @ApiProperty({ example: 1, description: '진도율 1~10' })
  progress_rate!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @ApiProperty({ example: 1, description: '학습 단계 1~10' })
  achievement_level!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @ApiProperty({ example: 1, description: '정답률 1~10' })
  correct_rate!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @ApiProperty({ example: 1, description: '메타인지 1~10' })
  metarecognition_rate!: number;

  private validate(): void {}
}
