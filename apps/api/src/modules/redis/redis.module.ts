import { Module, Global } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { RedisService } from './redis.service'
import { REDIS_CLIENT } from './redis.constants'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          retryStrategy: times => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
        })

        client.on('connect', () => {
          console.log('[RedisModule] Successfully connected to Redis')
        })

        client.on('error', err => {
          console.error('[RedisModule] Redis connection error:', err)
        })

        return client
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
