import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetConceptLikeMineDto {
  @IsNumber()
  @ApiProperty({ description: '개념영상 ID' })
  @Transform(({ value }) => Number(value))
  concept_video_id!: number;

  static validate() {}
}
