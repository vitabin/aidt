import { ApiProperty } from '@nestjs/swagger';
import { StudyType } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class GenerateAnalysisTableDto {
  @IsNumber()
  @Min(1)
  @ApiProperty()
  learning_sys_id!: number;

  @IsEnum(StudyType)
  @ApiProperty({ enum: StudyType })
  type!: StudyType;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  uuids!: string[];

  private validate(): void {}
}
