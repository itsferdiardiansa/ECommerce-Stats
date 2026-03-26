import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'
import { I18nContext } from 'nestjs-i18n'
import { ZodError } from 'zod'
import { error } from '@/common/helpers/api-response.helper'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  private static readonly STATUS_KEY: Record<number, string> = {
    400: 'common.errors.badRequest',
    401: 'common.errors.unauthorized',
    403: 'common.errors.forbidden',
    404: 'common.errors.notFound',
    409: 'common.errors.conflict',
    422: 'common.errors.unprocessableEntity',
    429: 'common.errors.tooManyRequests',
    500: 'common.errors.internalServerError',
    503: 'common.errors.serviceUnavailable',
  }

  private translateIfKey(i18n: I18nContext | null, value: string): string {
    if (!i18n) return value
    if (/^[\w]+(?:\.[\w]+)+$/.test(value)) {
      return i18n.t(value, { defaultValue: value })
    }
    return value
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const i18n = I18nContext.current(host)

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let errorMessage = 'Internal Server Error'
    let validationMessages:
      | Array<{
          field: string
          message: string
          code: string
        }>
      | undefined = undefined

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY
      errorMessage =
        i18n?.t('common.errors.unprocessableEntity') ?? 'Validation failed'

      const zodError = exception.getZodError() as ZodError
      const issues = zodError?.issues || []

      validationMessages = issues.map((issue: ZodError['issues'][number]) => {
        const { message: msg, path } = issue
        const rawField =
          path.length > 0 ? String(path[path.length - 1]) : 'field'

        let field: string = i18n?.t(`common.fields.${rawField}`, {
          defaultValue: '',
        }) as string
        if (!field) {
          field = rawField
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, s => s.toUpperCase())
        }

        const minArg = 'minimum' in issue ? { min: issue.minimum } : {}
        const maxArg = 'maximum' in issue ? { max: issue.maximum } : {}
        const translatedMessage = i18n?.t(msg, {
          args: { field, ...minArg, ...maxArg },
          defaultValue: msg,
        }) as string

        return {
          field: rawField,
          message: translatedMessage,
          code: issue.code,
        }
      })
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      errorMessage = i18n?.t(
        AllExceptionsFilter.STATUS_KEY[status] ??
          'common.errors.internalServerError',
        { defaultValue: exception.message }
      ) as string

      const raw = exception.getResponse()
      if (typeof raw === 'string') {
        errorMessage = this.translateIfKey(i18n ?? null, raw)
      } else if (typeof raw === 'object' && raw !== null) {
        const rawObj = raw as Record<string, unknown>
        const rawMsg = rawObj['message']
        if (typeof rawMsg === 'string') {
          errorMessage = this.translateIfKey(i18n ?? null, rawMsg)
        } else if (Array.isArray(rawMsg)) {
          errorMessage =
            rawMsg.length > 0
              ? this.translateIfKey(i18n ?? null, String(rawMsg[0]))
              : errorMessage
        }
      }
    } else {
      errorMessage =
        i18n?.t('common.errors.internalServerError') ?? 'Internal Server Error'
    }

    this.logger.error(
      `[${status}] ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined
    )

    const responseBody = error(
      status,
      errorMessage,
      request.url,
      validationMessages
    )

    response.status(status).json(responseBody)
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    }
    return codes[status] || 'UNKNOWN_ERROR'
  }
}
