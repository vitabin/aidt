import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class GetAchievementStandardDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: '현재 소단원 learning_sys 의 고유 id를 넘겨주세요.',
  })
  learning_sys_id!: number;

  private validate(): void {}
}
