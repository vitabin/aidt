import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class GetDreamJobsDto {
  @ApiProperty({ description: '몇개를 가져올지' })
  @IsNumber()
  @Min(1)
  take: number = 1;

  private validate(): void {}
}
