import { Injectable } from '@nestjs/common';
import { user_achievement } from '@prisma/client';
import { BaseRepository } from 'src/libs/base/base-query';
import { PrismaService } from 'src/prisma';

@Injectable()
export class UserAchievementQueryRepository extends BaseRepository<user_achievement> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async getLastestByUuid(uuid: string) {
    return await this.prisma.user_achievement.findFirst({
      where: {
        user_uuid: uuid,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }
}
