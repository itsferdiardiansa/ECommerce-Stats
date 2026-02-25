import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // ConfigService available everywhere without importing ConfigModule per feature
      envFilePath: '.env',
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
