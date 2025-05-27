import { BaseRepository } from 'src/libs/base';
import { PrismaService } from 'src/prisma';
import { chunk_format_data } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkDataQueryRepository extends BaseRepository<chunk_format_data> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async createChunkData(chunkData: string, chunkIndex: number, chunkSize: string, transferId: string) {
    return await this.prisma.chunk_format_data.create({
      data: {
        chunk_data: chunkData,
        chunk_index: chunkIndex,
        chunk_size: chunkSize,
        transfer_id: transferId,
      },
    });
  }

  async getChunkDataByTransferId(transferId: string) {
    return await this.prisma.chunk_format_data.findMany({
      orderBy: [
        {
          chunk_index: 'asc',
        },
      ],
      where: { transfer_id: transferId },
    });
  }
}
