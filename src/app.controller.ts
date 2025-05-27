import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SkipAuth } from './libs/decorators/skip-auth.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  healthCheck(): string {
    return this.appService.healthCheck();
  }
  @Get('init')
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  init(): string {
    // TODO: 전입 전출 초기 통신
    return 'ok';
  }
  @Post('init')
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  init2(): string {
    // TODO: 전입 전출 초기 통신
    return 'ok';
  }
}
