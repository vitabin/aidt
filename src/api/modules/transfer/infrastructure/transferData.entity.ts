import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { AchievementLevel } from './achievementLevel.entity';

export class TransferData {
  @IsString()
  curriculum!: string;
  @IsEnum(AchievementLevel)
  achievement_level!: AchievementLevel;
  @IsNumber()
  @Min(0)
  @Max(100)
  percent!: number;
  @IsString()
  partner_curriculum?: string;
}
