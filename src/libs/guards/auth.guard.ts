import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_AUTH_KEY } from '../decorators/skip-auth.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // // 먼저 헤더에 담긴 토큰을 뽑아옵니다.
    // const req = context.switchToHttp().getRequest();

    // const skipAuth = this.reflector.get<boolean>(SKIP_AUTH_KEY, context.getHandler());
    // if (skipAuth) {
    //   return true;
    // }
    // const token = req.headers['Authorization'] || req.headers['authorization'];
    // const keyId = req.headers['Key-ID'] || req.headers['key-id'];
    // const nonce = req.headers['Nonce'] || req.headers['nonce'];
    // if (!token) {
    //   this.logger.error('No Authorization Header');
    //   throw new UnauthorizedException('encryptedToken 을 헤더의 Authorization에 담아 보내주세요.');
    // }

    // if (!keyId) {
    //   this.logger.error('No Uuid Header');
    //   throw new UnauthorizedException('keyId를 헤더의 Key-ID에 담아 보내주세요.');
    // }

    // if (!nonce) {
    //   this.logger.error('No Nonce Header');
    //   throw new UnauthorizedException('nonce를 헤더의 Nonce에 담아 보내세요.');
    // }

    // try {
    //   const res = await fetch(this.configService.get('SSO_AGENT_HOST')! + 'sso-verify', {
    //     method: 'POST',
    //     body: JSON.stringify({ keyId: keyId, encryptedToken: token, securenonce: nonce }),
    //   });

    //   const result = await res.json();

    //   if (result.object.validate !== true) {
    //     throw new UnauthorizedException('유효하지 않은 인증 정보입니다.');
    //   } else {
    //     return true;
    //   }
    // } catch (error) {
    //   this.logger.error(error);
    //   throw new UnauthorizedException('SSO Agent를 통해 토큰을 검증하는 데 실패했습니다.');
    // }
    return true;
  }
}
