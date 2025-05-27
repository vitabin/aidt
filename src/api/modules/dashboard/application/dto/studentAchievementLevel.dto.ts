import { IsString, IsNumber } from 'class-validator';

export class StudentAchievementLevelDto {
  @IsString()
  chapterName!: string;

  @IsNumber()
  learningMapNodeId!: number;

  @IsNumber()
  achivementLevel!: number;

  private validate(): void {}
}
