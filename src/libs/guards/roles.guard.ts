import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const role = request.headers['role'] || '';

    if (!role) {
      throw new BadRequestException(`사용자 종류(S,P,T) 중 하나를 헤더의 Role에 담아 보내세요. 현재 Role : ${role}`);
    }

    if (!requiredRoles) {
      return true;
    }

    return requiredRoles.includes(role);
  }
}
