import { ArgumentMetadata, Injectable } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'

@Injectable()
export class ValidationPipe extends ZodValidationPipe {
  public override transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && !value) {
      return super.transform({}, metadata)
    }
    return super.transform(value, metadata)
  }
}
