import { readFileSync } from 'node:fs'
import { NestFactory } from '@nestjs/core'
import { z } from 'zod'
import cookieParser from 'cookie-parser'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ValidationPipe } from './common/pipes/validation.pipe'
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor'
import { i18nZodErrorMap } from './common/i18n-zod.map'
import { assertProductionSecrets } from './config/assert-secrets'

async function bootstrap() {
  assertProductionSecrets()
  z.config({ customError: i18nZodErrorMap })

  const keyFile = process.env.SSL_KEY_FILE
  const certFile = process.env.SSL_CERT_FILE
  const httpsOptions =
    keyFile && certFile
      ? { key: readFileSync(keyFile), cert: readFileSync(certFile) }
      : undefined

  const app = await NestFactory.create(
    AppModule,
    httpsOptions ? { httpsOptions } : {}
  )
  const configService = app.get(ConfigService)

  app.enableCors({
    origin: configService.get<boolean | string>('cors.origin'),
    credentials: configService.get<boolean>('cors.credentials'),
  })

  // Trust the first proxy so req.ip reflects the real client (X-Forwarded-For)
  // behind a load balancer — required for correct geo, and per-IP brute-force.
  app.getHttpAdapter().getInstance().set('trust proxy', 1)

  app.use(cookieParser())
  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new SerializeInterceptor())

  await app.listen(configService.get<number>('port') ?? 3000)
}
void bootstrap()
