import { Module } from '@nestjs/common';
import { KerisService } from './application/keris.service';

@Module({
  providers: [KerisService],
})
export class KerisModule {}
