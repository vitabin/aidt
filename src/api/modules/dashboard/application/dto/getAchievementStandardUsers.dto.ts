import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsString, Min } from 'class-validator';

export class GetAchievementStandardUsersDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: '현재 소단원 learning_sys 의 고유 id를 넘겨주세요.',
  })
  learning_sys_id!: number;

  @ApiProperty({ description: '학급 전체 uuids' })
  @IsString({ each: true })
  @IsArray()
  @Transform(({ value }) => value.split(',').map((uuid: string) => uuid.trim()))
  classUuids!: string[];

  private validate(): void {}
}
