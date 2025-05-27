import { AchievementLevel } from 'src/api/modules/transfer/infrastructure';

export function turnScoreToAchievementLevel(score: number): AchievementLevel {
  if (score <= 40) {
    return AchievementLevel.A;
  } else if (score <= 70) {
    return AchievementLevel.B;
  } else if (score <= 80) {
    return AchievementLevel.C;
  } else if (score <= 90) {
    return AchievementLevel.D;
  } else {
    return AchievementLevel.E;
  }
}

export function turnAchievementToScore(level: AchievementLevel): number {
  switch (level) {
    case AchievementLevel.A:
      return 40;
    case AchievementLevel.B:
      return 70;
    case AchievementLevel.C:
      return 80;
    case AchievementLevel.D:
      return 90;
    default:
      return 100;
  }
}
