import { Module } from '@nestjs/common';
import { SharedVideoController } from './interface/sharedVideo.controller';
import { PrismaModule } from 'src/prisma';
import { StudyQueryRepository } from '../../infrastructure';
import { QuestionService } from 'src/api/modules/question/application/question.service';
import { StudyService } from '../../application';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from 'src/api/modules/problem';
import { LearningLevelQueryRepository, LearningSysMapNodeQueryRepository, LearningSysQueryRepository } from 'src/api/modules/learning';
import { UserAchievementQueryRepository } from 'src/api/modules/user_achievement/infrastructure';
import { KerisService } from 'src/api/modules/keris/application/keris.service';
import { LearningService } from 'src/api/modules/learning/application/learning.service';

const repository = [
  StudyQueryRepository,
  ProblemQueryRepository,
  ProblemSolvingQueryRepository,
  LearningSysMapNodeQueryRepository,
  LearningSysQueryRepository,
  UserAchievementQueryRepository,
  LearningLevelQueryRepository,
];

const service = [StudyService, QuestionService, KerisService, LearningService];
@Module({
  imports: [PrismaModule],
  controllers: [SharedVideoController],
  providers: [...service, ...repository],
  exports: [...service, ...repository],
})
export class SharedVideoModule {}
