import { IsNumber, IsString } from 'class-validator';

export class StudentProgressRateDto {
  @IsString()
  chapterName!: string;

  @IsNumber()
  learningMapNodeId!: number;

  @IsNumber()
  progressRate!: number;

  private validate(): void {}
}
