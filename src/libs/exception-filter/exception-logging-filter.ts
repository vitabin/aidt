import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Request, Response } from 'express';
import { formatDateToKoreanString } from '../utils/dateFormatter';

@Catch()
export class ExceptionLoggingFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.getResponse() : exception.message;

    const time = formatDateToKoreanString(new Date());
    this.logger.error({
      statusCode: status,
      timestamp: time,
      path: request.url,
      message: exception.message,
      stack: exception.stack || 'no stack',
    });

    response.status(status).json({
      statusCode: status,
      timestamp: time,
      path: request.url,
      message: status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal Server Error' : message,
    });
  }
}
