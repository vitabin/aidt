import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { RolesGuard } from 'src/libs/guards/roles.guard';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';

@ApiTags('user-achivement')
@Controller({ path: 'user-achivement', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseGuards(RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class UserAchivemenetController {}
