import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetConceptDto {
  @IsNumber()
  @ApiProperty({ description: '해당 단원 ID' })
  @Transform(({ value }) => Number(value))
  learning_sys_id!: number;

  static validate() {}
}
