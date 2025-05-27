import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class GetAccumulateDto {
  @ApiProperty({ description: '학급 전체 uuids' })
  @IsString({ each: true })
  @IsArray()
  @Transform(({ value }) => value.split(',').map((uuid: string) => uuid.trim()))
  classUuids!: string[];
}
