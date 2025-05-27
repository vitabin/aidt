import { Inject, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, query, body } = req;
    const userAgent = req.get('user-agent') || '';
    const uuid = req.headers['Uuid'] || req.headers['uuid'] || 'anonymous';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.info(
        `User <${uuid}>'s Request Received: Method: ${method} Path: ${originalUrl} StatusCode: ${statusCode} - Response Time: ${responseTime}ms - User Agent: ${userAgent} - IP Address: ${req.ip} | Query: ${JSON.stringify(query)} | Body: ${JSON.stringify(body)} | Headers: ${JSON.stringify(req.headers)}`,
        ``,
      );
    });

    next();
  }
}
