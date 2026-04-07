import { NestFactory } from '@nestjs/core'
import { z } from 'zod'
import cookieParser from 'cookie-parser'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ValidationPipe } from './common/pipes/validation.pipe'
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor'
import { i18nZodErrorMap } from './common/i18n-zod.map'

async function bootstrap() {
  z.config({ customError: i18nZodErrorMap })
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  app.enableCors({
    origin: configService.get<boolean | string>('cors.origin'),
    credentials: configService.get<boolean>('cors.credentials'),
  })

  app.use(cookieParser())
  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new SerializeInterceptor())

  await app.listen(configService.get<number>('port') ?? 3000)
}
void bootstrap()
