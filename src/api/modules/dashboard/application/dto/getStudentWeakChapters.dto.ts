import { IsNumber } from 'class-validator';

export class GetStudentWeakChaptersDto {
  @IsNumber()
  learningSysId!: number;
}
