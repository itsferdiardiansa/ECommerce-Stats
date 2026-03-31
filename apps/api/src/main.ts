import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ValidationPipe } from './common/pipes/validation.pipe'
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor'
import { i18nZodErrorMap } from './common/i18n-zod.map'
import { z } from 'zod'

async function bootstrap() {
  z.config({ customError: i18nZodErrorMap })
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new SerializeInterceptor())

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
