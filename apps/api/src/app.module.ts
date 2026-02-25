import { Module } from '@nestjs/common'
import { ConfigModule, I18nModule } from './modules'
import { UsersModule } from './features'

@Module({
  imports: [ConfigModule, I18nModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
