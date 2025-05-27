import { achievement_standard } from '@prisma/client';

export class studentAchievementStandardResponseDto {
  problemCount!: number;
  achievementStandardScore!: number;
  achievementStandard!: achievement_standard;
}
