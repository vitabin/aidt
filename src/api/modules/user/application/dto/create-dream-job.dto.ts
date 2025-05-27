import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDreamJobDto {
  @ApiProperty({ description: '0,1,2 중 하나를 적어주세요. 각각 1지망,2지망,3지망' })
  @Min(0)
  @Max(2)
  index!: number;

  @ApiProperty({ description: '<index>지망 희망 직업' })
  @IsString()
  job!: string;

  @ApiProperty({ description: '<index>지망 희망 직업 이유' })
  @IsString()
  @IsOptional()
  reason?: string;

  private validate(): void {}
}
