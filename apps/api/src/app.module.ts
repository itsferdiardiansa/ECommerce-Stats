import { Module } from '@nestjs/common'
import { ConfigModule, I18nModule, RedisModule } from './modules'
import { AuthModule, UsersModule } from './features'

@Module({
  imports: [ConfigModule, I18nModule, RedisModule, AuthModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
