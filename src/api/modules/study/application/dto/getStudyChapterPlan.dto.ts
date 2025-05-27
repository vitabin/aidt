import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetStudyChapterPlanDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 1, description: '학기 ID. DB의 semester table을 참고하세요.' })
  semester_id!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({ description: '단원 ID' })
  learning_sys_id?: number;

  private validate(): void {}
}
