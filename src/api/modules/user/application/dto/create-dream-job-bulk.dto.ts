import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateDreamJobBulkDto {
  @ApiProperty({ description: '장래희망을 1지망|2지망|3지망 으로 적어주세요.' })
  @IsString()
  jobs!: string;

  @ApiProperty({ description: '이유를 1지망이유|2지망이유|3지망이유 으로 적어주세요.' })
  @IsString()
  @IsOptional()
  reasons?: string;

  private validate(): void {}
}
