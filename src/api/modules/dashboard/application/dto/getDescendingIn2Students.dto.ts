import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export enum DescendingPart {
  LEARNING_LEVEL = 'LEARNING_LEVEL',
  PROBLEM_SOLVING_COUNT = 'PROBLEM_SOLVING_COUNT',
  CORRECT_RATE = 'CORRECT_RATE',
  LEARNING_TIME = 'LEARNING_TIME',
}

export class GetDescendingIn2StudentsDto {
  @IsNumber()
  @ApiProperty({ description: '해당 소단원의 learning_sys_id입니다.' })
  learningSysId!: number;
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    } else {
      return value.split(',');
    }
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  studentIds!: string[];
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    } else {
      return value.split(',');
    }
  })
  @IsEnum(DescendingPart, { each: true })
  fetchingParts!: DescendingPart[];
}
