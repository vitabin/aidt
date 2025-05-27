import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { StudyService } from './application';
import { StudyController } from './interface';
import { StudyQueryRepository } from './infrastructure';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from '../problem';
import { LearningSysMapNodeQueryRepository, LearningSysQueryRepository } from '../learning';
import { QuestionService } from '../question/application/question.service';
import { SharedVideoModule } from './submodules/shared-video/sharedVideo.module';
import { SharedSolutionVideoModule } from './submodules/shared-solution-video/shared-solution-video.module';
import { UserAchievementQueryRepository } from '../user_achievement/infrastructure';
import { LearningService } from '../learning/application/learning.service';

const repository = [
  StudyQueryRepository,
  ProblemQueryRepository,
  ProblemSolvingQueryRepository,
  LearningSysMapNodeQueryRepository,
  LearningSysQueryRepository,
  UserAchievementQueryRepository,
];

const service = [
  StudyService, 
  QuestionService, 
  LearningService
];

@Module({
  imports: [PrismaModule, SharedVideoModule, SharedSolutionVideoModule],
  controllers: [StudyController],
  providers: [...service, ...repository],
  exports: [...service, ...repository],
})
export class StudyModule {}
