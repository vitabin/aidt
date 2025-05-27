import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
@Injectable()
export class UserAchievementService {
  constructor(private readonly prisma: PrismaService) {}

  async getLastUserAchievementsByLearningSysId(learning_sys_id: number, user_uuid: string) {
    return await this.prisma.user_achievement.findFirst({
      where: {
        learning_sys_id,
        user_uuid,
      },
      include: {
        learning_level: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
