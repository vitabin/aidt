import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, Min } from 'class-validator';

export class GetTeacherWeakChaptersDto {
  @ApiProperty({ description: '기준이 될 learning_sys_id' })
  @IsNumber()
  @Min(1)
  learning_sys_id!: number;

  @ApiProperty({ description: '반 전체 학생 uuid를 배열에 담아주십시오.' })
  @IsString({ each: true })
  @IsArray()
  uuids!: string[];
}
