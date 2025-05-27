import { Module } from '@nestjs/common';
import { ClovaService } from './application/clova.service';
import { ClovaController } from './interface/clova.controller';

@Module({
  providers: [ClovaService],
  controllers: [ClovaController]
})
export class ClovaModule {}
