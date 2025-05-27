import { Module } from '@nestjs/common';
import { LearningModule, LearningSysMapNodeQueryRepository, LearningSysQueryRepository } from '../learning';
import { AssignmentModule } from '../assignment';
import { AssessmentModule } from '../assessment';
import { QuestionModule } from '../question/question.module';
import { StudyModule } from '../study';
import { DashboardController } from './interface';
import { DashboardService } from './application/dashboard.service';
import { ProblemModule } from '../problem';
import { PrismaModule } from 'src/prisma';
import { UserAchievementModule } from '../user_achievement';
import { UserModule } from '../user';
import { HistoryService } from 'src/history/history.service';

const importTargets = [
  PrismaModule,
  AssignmentModule,
  AssessmentModule,
  ProblemModule,
  QuestionModule,
  StudyModule,
  UserModule,
  LearningModule,
  UserAchievementModule,
];

const repository = [LearningSysMapNodeQueryRepository, LearningSysQueryRepository];

@Module({
  imports: [...importTargets],
  providers: [DashboardService, ...repository, HistoryService],
  exports: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
