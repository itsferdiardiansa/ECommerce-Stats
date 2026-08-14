import { readFileSync } from 'node:fs'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import type { Express } from 'express'
import { z } from 'zod'
import cookieParser from 'cookie-parser'
import {
  AllExceptionsFilter,
  ValidationPipe,
  i18nZodErrorMap,
} from '@rufieltics/api-core'
import { AppModule } from './app.module'

async function bootstrap() {
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
  const config = app.get(ConfigService)

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3001'),
    credentials: true,
  })
  const httpInstance = app.getHttpAdapter().getInstance() as Express
  httpInstance.set('trust proxy', 1)
  app.use(cookieParser())
  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalPipes(new ValidationPipe())

  await app.listen(config.get<number>('PORT', 6002))
}

void bootstrap()
