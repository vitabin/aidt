import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateStudyReminderNotificationsDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: '이 알림을 받을 학생들의 uuids를 배열에 담아 보내주세요.' })
  taker_uuids!: Array<string>;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: '소단원 learning_sys_id' })
  learning_sys_id!: number;

  @IsNumber()
  @Min(3)
  @Max(5)
  @ApiProperty({ description: '기본문제 : 3, 확인문제 : 4, 피드백문제 : 5' })
  action!: number;
}
