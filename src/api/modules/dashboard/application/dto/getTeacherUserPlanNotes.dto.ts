import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';

export class GetTeacherUserPlanNotesDto {
  @ApiProperty({ description: '반 전체 학생 uuid를 배열에 담아주십시오.' })
  @IsString({ each: true })
  @IsArray()
  uuids!: string[];
}
