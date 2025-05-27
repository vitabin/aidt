import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { ConceptService } from './application';
import { ConceptController } from './interface';

@Module({
  imports: [PrismaModule],
  providers: [ConceptService],
  exports: [ConceptService],
  controllers: [ConceptController],
})
export class ConceptModule {}
