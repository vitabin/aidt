import { BadRequestException, ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Role } from './role.enum';

export const RoleHeader = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const role = request.headers['Role'] || request.headers['role'];
  if (!role) {
    throw new BadRequestException('사용자 종류(S, T, P)를 헤더 Role에 담아보내주세요.');
  }
  if (!Object.values(Role).includes(role as Role)) {
    throw new BadRequestException('사용자 종류는 S, T, P 중 하나여야 합니다.');
  }
  return role as Role;
});
