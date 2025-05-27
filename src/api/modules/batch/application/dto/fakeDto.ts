import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class fakeDto {
  @IsString()
  @ApiProperty()
  transferId!: string;
}
