import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class GetSharedVideoForConceptDto {
  @IsNumber()
  @ApiProperty({ description: '소단원의 learning_sys_id입니다.' })
  learningSysId!: number;
  @IsOptional()
  page: number = 1;
  @IsOptional()
  pageSize: number = 20;
  @IsBoolean()
  @Transform((value) => {
    return value.obj.onlyMine === 'true';
  })
  @IsOptional()
  onlyMine: boolean = false;
}
