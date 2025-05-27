import { QuestionScope } from '@prisma/client';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsNumber()
  problemId!: number;

  @IsString()
  title!: string;

  @IsEnum(QuestionScope)
  scope!: QuestionScope;

  private validate(): void {}
}
