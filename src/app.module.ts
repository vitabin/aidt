import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from '@libs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ApiModule } from './api';
import { RequestLoggerMiddleware } from './libs/middleware/request-logger.middleware';
import { WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import { instance } from './libs/winston.logger';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './libs/guards/auth.guard';
import { CacheModule } from '@nestjs/cache-manager';
import { HistoryService } from './history/history.service';
import { Logger } from 'winston';
import Redis from 'ioredis';
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis';
import { TransferModule } from './api/modules/transfer/transfer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    PrismaModule,
    ApiModule,
    TransferModule,
    WinstonModule.forRootAsync({
      useFactory: () => instance,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule, WinstonModule],
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
      useFactory: async (configService: ConfigService, logger: Logger) => {
        const redisClient = new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: parseInt(configService.get<string>('REDIS_PORT')!, 10),
          username: configService.get<string>('REDIS_USERNAME'),
          password: configService.get<string>('REDIS_PASSWORD'),
          retryStrategy: (times) => {
            logger.error(`Redis connection lost. Attempting to reconnect (${times})...`);
            if (times > 600) {
              logger.error('Maximum retry attempts reached. Failing...');
              return null; // Do not retry further
            }
            return 1000;
          },
        });

        redisClient.on('error', (err) => {
          logger.error('Redis error:', err);
        });

        return {
          store: ioRedisStore({
            redisInstance: redisClient,
          }),
        };
      },
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    HistoryService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).exclude('/', '/health').forRoutes('*');
  }
}
