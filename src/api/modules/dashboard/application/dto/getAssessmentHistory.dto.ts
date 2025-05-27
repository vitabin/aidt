import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class GetAssessmentHistoryDto {
  @ApiProperty({ description: '학급 전체 uuids' })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value.split(',').map((uuid: string) => uuid.trim()))
  classUuids!: string[];

  @ApiProperty({ description: '평가 id' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  assessmentId!: number;
}
