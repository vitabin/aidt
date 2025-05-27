import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsNumber } from 'class-validator';

export class AssignmentFinishDto {
  @ApiProperty({description: '출제된 과제ID'})
  @IsNumber({}, {each: true})
  @IsArray()
  assignment_gave_id!: number[];

  @IsDate()
  finished_at!: Date;

  private validate(): void {}
}
