import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ExceptionLoggingFilter } from 'src/libs/exception-filter/exception-logging-filter';
import { ReportService } from '../application';
import { ResponseInterceptor } from 'src/libs/interceptors/response.interceptor';
@ApiSecurity('access_token')
@ApiSecurity('uuid')
@ApiSecurity('role')
@ApiSecurity('keyId')
@ApiSecurity('nonce')
@ApiTags('report')
@Controller({ path: 'report', version: ['1'] })
@UseFilters(ExceptionLoggingFilter)
@UseInterceptors(ResponseInterceptor)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
}
