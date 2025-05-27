import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class GetTeacherDashboardProblemsDto {
  @ApiProperty({ description: '대상 학생 uuid' })
  @IsString()
  uuid!: string;

  @ApiProperty({ description: '소단원 아이디' })
  @IsNumber()
  @Min(1)
  learning_sys_id!: number;

  @ApiProperty({ description: 'BASIC|CONFIRM|FEEDBACK|ASSIGNMENT' })
  @IsString()
  type!: string;
}
