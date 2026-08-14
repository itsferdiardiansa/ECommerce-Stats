import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule as NestI18nModule,
  QueryResolver,
} from 'nestjs-i18n'
import path from 'path'

@Module({
  imports: [
    NestI18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        fallbackLanguage: config.get<string>('APP_FALLBACK_LANG', 'en'),
        loaderOptions: {
          path: path.join(__dirname, '../../i18n/'),
          watch: config.get<string>('NODE_ENV') !== 'production',
        },
        typesOutputPath: path.join(
          process.cwd(),
          'src/modules/i18n/i18n.generated.ts'
        ),
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      inject: [ConfigService],
    }),
  ],
  exports: [NestI18nModule],
})
export class I18nModule {}
