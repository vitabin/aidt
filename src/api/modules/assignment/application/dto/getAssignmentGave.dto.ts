import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { AssignmentType } from '@prisma/client';

export class GetAssignmentGaveDto {
  @ApiProperty({ description: '학급전체 uuids' })
  @IsString({ each: true })
  @IsArray()
  classUuids!: string[];

  @ApiProperty({ description: '과제 type', enum: ['BASIC', 'CONFIRM', 'FEEDBACK', 'METACOGNITION'] })
  @IsEnum(AssignmentType, { each: true })
  @IsArray()
  types!: AssignmentType[];

  @ApiProperty({ description: '과제 문제 수의 배수', default: 1 })
  @IsNumber()
  @Min(1)
  @Max(5)
  factor: number = 1;

  @ApiProperty({ description: '단원 ID' })
  @IsNumber()
  learningSysId!: number;
}
