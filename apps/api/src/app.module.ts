import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { BullModule } from '@nestjs/bullmq'
import {
  ConfigModule,
  I18nModule,
  RedisModule,
  JwtModule,
  MailModule,
  NotificationsModule,
} from './modules'
import { AuthModule, UsersModule, OrganizationsModule } from './features'
import { I18nThrottlerGuard } from '@/common/guards/throttler.guard'

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 60),
        },
      ],
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: config.get<number>('REDIS_DB', 0),
        },
      }),
    }),
    ConfigModule,
    I18nModule,
    RedisModule,
    JwtModule,
    MailModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: I18nThrottlerGuard,
    },
  ],
})
export class AppModule {}
