import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { ProblemService } from './application';
import { ProblemController } from './interface';
import { ProblemQueryRepository, ProblemSolvingQueryRepository } from './infrastructure';
import { StudyQueryRepository } from '../study';
import { LearningService } from '../learning/application/learning.service';

const repository = [StudyQueryRepository, ProblemQueryRepository, ProblemSolvingQueryRepository];

const service = [ProblemService, LearningService];
@Module({
  imports: [PrismaModule],
  controllers: [ProblemController],
  providers: [...service, ...repository],
  exports: [...service, ...repository],
})
export class ProblemModule {}
