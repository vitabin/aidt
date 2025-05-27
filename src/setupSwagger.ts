import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Swagger 세팅
 *
 * @param {INestApplication} app
 */
export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('AI Digital Textbook API Docs')
    .setVersion('1.0.0')
    .addSecurity('access_token', {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'SSO Agent에서 받은 encryptedToken을 넣어주시면 됩니다.',
    })
    .addSecurity('nonce', {
      type: 'apiKey',
      name: 'Nonce',
      in: 'header',
      description: 'SSO Agent에서 받은 nonce를 넣어주시면 됩니다.',
    })
    .addSecurity('keyId', {
      type: 'apiKey',
      name: 'Key-ID',
      in: 'header',
      description: 'SSO Agent에서 받은 keyId를 넣어주시면 됩니다.',
    })
    .addSecurity('uuid', {
      type: 'apiKey',
      name: 'Uuid',
      in: 'header',
      description: '유저의 uuid를 넣어주시면 됩니다.',
    })
    .addSecurity('role', {
      type: 'apiKey',
      name: 'Role',
      in: 'header',
      description: '사용자 종류를 넣어주시면 됩니다. S(학생), T(교사), P(학부모)',
    })
    .addSecurityRequirements({
      securitySchemes: ['access_token', 'uuid', 'role'],
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}
