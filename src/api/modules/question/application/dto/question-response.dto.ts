import { IsNumber, IsObject } from 'class-validator';
import { Question } from '../../infrastructure/question.entity';

export class QuestionResponseDto {
  @IsObject()
  questions!: Question[];

  @IsNumber()
  totalPage!: number;

  answeredQuestionsCount?: number;
  awaitingQuestionsCount?: number;
}
