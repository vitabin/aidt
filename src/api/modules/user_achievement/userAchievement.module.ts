import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { UserAchievementService } from './application';
import { UserAchievementQueryRepository } from './infrastructure';
import { UserAchivemenetController } from './interface';

@Module({
  imports: [PrismaModule],
  providers: [UserAchievementService, UserAchievementQueryRepository],
  exports: [UserAchievementService, UserAchievementQueryRepository],
  controllers: [UserAchivemenetController],
})
export class UserAchievementModule {}
