import { Module } from '@nestjs/common';
import { AssignmentService } from './application';
import { AssignmentController } from './interface';
import { PrismaModule } from 'src/prisma';
import { StudyQueryRepository, StudyService } from '../study';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from '../problem';
import { LearningService } from '../learning/application/learning.service';
import { LearningLevelQueryRepository, LearningSysQueryRepository } from '../learning';
import { UserAchievementQueryRepository } from '../user_achievement/infrastructure';
import { KerisService } from '../keris/application/keris.service';
import { NotificationModule } from '../notification';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [AssignmentController],
  providers: [
    AssignmentService,
    ProblemQueryRepository,
    StudyService,
    StudyQueryRepository,
    ProblemSolvingQueryRepository,
    LearningService,
    LearningSysQueryRepository,
    UserAchievementQueryRepository,
    LearningLevelQueryRepository,
    KerisService,
  ],
  exports: [
    AssignmentService,
    ProblemQueryRepository,
    StudyService,
    StudyQueryRepository,
    ProblemSolvingQueryRepository,
    LearningService,
    LearningSysQueryRepository,
    UserAchievementQueryRepository,
    LearningLevelQueryRepository,
  ],
})
export class AssignmentModule {}
