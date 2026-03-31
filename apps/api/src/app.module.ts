import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule, I18nModule, RedisModule, JwtModule } from './modules'
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
    ConfigModule,
    I18nModule,
    RedisModule,
    JwtModule,
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
