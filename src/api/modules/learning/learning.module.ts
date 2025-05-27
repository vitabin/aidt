import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { LearningSysMapNodeQueryRepository } from './infrastructure/learning_map';
import { LearningSysQueryRepository } from './infrastructure/learning_sys';
import { LearningController } from './interface/learning.controller';
import { LearningService } from './application/learning.service';
import { LearningLevelQueryRepository } from './infrastructure/learning_level';

@Module({
  imports: [PrismaModule],
  providers: [LearningSysMapNodeQueryRepository, LearningSysQueryRepository, LearningService, LearningLevelQueryRepository],
  exports: [LearningSysMapNodeQueryRepository, LearningSysQueryRepository, LearningLevelQueryRepository],
  controllers: [LearningController],
})
export class LearningModule {}
