import { Module } from '@nestjs/common';
import { BatchService } from './application';
import { BatchController } from './interface';
import { PrismaModule } from 'src/prisma';
import { BatchTransferQueryRepository, ChunkDataQueryRepository } from './infrastructure';

@Module({
  imports: [PrismaModule],
  controllers: [BatchController],
  providers: [BatchService, BatchTransferQueryRepository, ChunkDataQueryRepository],
  exports: [BatchService, BatchTransferQueryRepository, ChunkDataQueryRepository],
})
export class BatchModule {}
