import { ApiProperty } from '@nestjs/swagger';
import { AssignmentType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNumber } from 'class-validator';

export class GetAssignmentDto {
  @ApiProperty({ description: '단원 ID' })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  learningSysId!: number;

  @ApiProperty({ description: '과제 타입, 과제 유무 조회에서 추출가능' })
  @IsEnum(AssignmentType, { each: true })
  @IsArray()
  @Transform(({ value }) => value.split(',').map((type: string) => type.trim()))
  assignmentType!: AssignmentType[];
}
