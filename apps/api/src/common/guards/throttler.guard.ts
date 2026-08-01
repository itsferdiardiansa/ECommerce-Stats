import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { I18nContext } from 'nestjs-i18n'

@Injectable()
export class I18nThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ExecutionContext
  ): Promise<void> {
    const i18n = I18nContext.current()
    const message = i18n
      ? i18n.t('common.errors.tooManyRequests')
      : 'Too Many Requests'

    throw new HttpException(
      {
        success: false,
        message,
        data: null,
      },
      HttpStatus.TOO_MANY_REQUESTS
    )
  }
}
