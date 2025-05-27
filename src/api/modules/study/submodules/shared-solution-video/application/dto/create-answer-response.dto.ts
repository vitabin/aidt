import { IsNumber } from 'class-validator';

export class CreateAnswerResponseDto {
  @IsNumber()
  id!: number;
}
