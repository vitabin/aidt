import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UUIDHeader = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.headers['Uuid'] || request.headers['uuid'];
});
