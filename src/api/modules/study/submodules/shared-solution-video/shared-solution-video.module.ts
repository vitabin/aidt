import { Module } from '@nestjs/common';
import { SharedSolutionVideoController } from './interface/shared-solution-video.controller';
import { SharedSolutionVideoService } from './application/shared-solution-video.service';

import { PrismaModule } from 'src/prisma';
import { KerisService } from 'src/api/modules/keris/application/keris.service';

@Module({
  controllers: [SharedSolutionVideoController],
  providers: [SharedSolutionVideoService, KerisService],
  imports: [PrismaModule],
  exports: [SharedSolutionVideoService],
})
export class SharedSolutionVideoModule {}
