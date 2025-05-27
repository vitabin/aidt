import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class GetByProblemIdDto {
  @ApiProperty({
    example: 1,
    description: 'Problem ID (PK)',
    required: true,
  })
  @IsNumber()
  id!: number;

  private validate(): void {}
}
