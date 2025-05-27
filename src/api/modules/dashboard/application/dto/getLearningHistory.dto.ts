import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class GetLearningHistoryDto {
  @ApiProperty({ description: '학급 전체 uuids' })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value.split(',').map((uuid: string) => uuid.trim()))
  classUuids!: string[];

  @ApiProperty({ description: '조회할 단원 아이디' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  learningSysId!: number;
}
