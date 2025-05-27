import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { setupSwagger } from './setupSwagger';

async function bootstrap(): Promise<string> {
  const app = await NestFactory.create(AppModule);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  if (process.env.NODE_ENV !== 'production') {
    //swagger
    setupSwagger(app);
  }

  //class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  process.on('SIGTERM', async () => {
    if (!process.env['DEBUG']) {
      await app.close();
    }
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    if (!process.env['DEBUG']) {
      await app.close();
    }
    process.exit(1);
  });

  try {
    if (process.env['DEBUG'] === 'true') {
      app.enableCors();
    }
    await app.listen(process.env.PORT ?? 3000, () => {
      console.info(
        new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Seoul',
        }),
        `⚡️ Listening on port 'http://localhost:${process.env.PORT ?? 3000}' 😎 DEBUG? : ${process.env.DEBUG}`,
      );
    });
    return app.getUrl();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
bootstrap();
