import { BaseRepository } from 'src/libs/base';
import { PrismaService } from 'src/prisma';
import { batch_transfer } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BatchTransferQueryRepository extends BaseRepository<batch_transfer> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma);
  }

  async createTransferInfo(partnerId: string, transferId: string, partnerAccessToken: string, startTime: string) {
    return await this.prisma.batch_transfer.create({
      data: {
        partner_id: partnerId,
        transfer_id: transferId,
        partner_access_token: partnerAccessToken,
        start_time: startTime,
      },
    });
  }

  async getTransferInfoByTransferId(transferId: string) {
    return await this.prisma.batch_transfer.findFirst({
      where: { transfer_id: transferId },
    });
  }
}
