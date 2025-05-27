import { Module } from '@nestjs/common';
import { AssessmentController } from './interface';
import { AssessmentService } from './application';
import { PrismaModule } from 'src/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
