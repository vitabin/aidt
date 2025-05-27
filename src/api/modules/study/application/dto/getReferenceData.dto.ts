import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class GetReferenceDataDto {
  @IsString()
  @ApiProperty({
    description: '확장 소단원에 할당되는 표준학습체계 ID입니다.',
  })
  clsId!: string;
  @IsNumber()
  @Min(1)
  page: number = 1;
  @IsNumber()
  @Min(1)
  pageSize: number = 10;
}
