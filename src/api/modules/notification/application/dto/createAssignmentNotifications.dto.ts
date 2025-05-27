import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, Min } from 'class-validator';

export class CreateAssignmentNotificationsDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: '이 알림을 받을 학생들의 uuids를 배열에 담아 보내주세요.' })
  taker_uuids!: Array<string>;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: '소단원 learning_sys_id' })
  learning_sys_id!: number;
}
