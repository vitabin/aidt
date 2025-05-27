import { Module } from '@nestjs/common';
import { QuestionService } from './application/question.service';
import { PrismaModule } from 'src/prisma';
import { QuestionController } from './interface/question.controller';

@Module({
  providers: [QuestionService],
  controllers: [QuestionController],
  imports: [PrismaModule],
})
export class QuestionModule {}
