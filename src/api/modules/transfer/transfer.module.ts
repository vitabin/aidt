import { Module } from '@nestjs/common';
import { TransferController } from './interface/transfer.controller';
import { TransferService } from './application/transfer.service';
import { PrismaModule } from 'src/prisma';
import { KerisService } from '../keris/application/keris.service';

@Module({
  imports: [PrismaModule],
  controllers: [TransferController],
  providers: [TransferService, KerisService],
})
export class TransferModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(RedirectMiddleware).forRoutes({ path: 'transfer/in', method: RequestMethod.GET });
  // }
}
