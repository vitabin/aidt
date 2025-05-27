import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetExistAssignmentDto {
  @ApiProperty({ description: '단원정보' })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  learningSysId!: number;
}
