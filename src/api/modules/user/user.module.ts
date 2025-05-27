import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { UserController } from './interface';
import { UserService } from './application';
import { KerisService } from '../keris/application/keris.service';
import { AssessmentModule } from '../assessment';

@Module({
  imports: [PrismaModule, AssessmentModule],
  controllers: [UserController],
  providers: [UserService, KerisService],
  exports: [UserService],
})
export class UserModule {}
