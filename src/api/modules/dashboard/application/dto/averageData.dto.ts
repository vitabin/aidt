import { Type } from 'class-transformer';
import { IsNumber, ValidateNested } from 'class-validator';

class PerformsByDifficulty {
  @IsNumber()
  HIGHEST!: number;

  @IsNumber()
  HIGH!: number;

  @IsNumber()
  MIDDLE!: number;

  @IsNumber()
  LOW!: number;

  @IsNumber()
  SUM!: number;
}

export class AverageDataDto {
  @IsNumber()
  percentage_study_duration!: number;

  @IsNumber()
  percentage_study_performs!: number;

  @IsNumber()
  percentage_correct_rate!: number;

  @IsNumber()
  achievement_level!: number;

  @ValidateNested()
  @Type(() => PerformsByDifficulty)
  performs_by_difficulty!: PerformsByDifficulty;

  private validate(): void {}
}
