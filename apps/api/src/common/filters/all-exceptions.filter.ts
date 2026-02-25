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
      return i18n.t(value, { defaultValue: value }) as string
    }
    return value
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const i18n = I18nContext.current(host)

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | object = 'Internal Server Error'

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY

      const zodError = exception.getZodError() as ZodError
      const issues = zodError?.issues || []

      const translatedIssues = issues.map(
        (issue: ZodError['issues'][number]) => {
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

          return { ...issue, message: translatedMessage }
        }
      )

      message = {
        statusCode: status,
        error:
          i18n?.t('common.errors.unprocessableEntity') ??
          'Unprocessable Entity',
        message: translatedIssues,
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const raw = exception.getResponse()
      const errorLabel = i18n?.t(
        AllExceptionsFilter.STATUS_KEY[status] ??
          'common.errors.internalServerError',
        { defaultValue: exception.message }
      ) as string

      if (typeof raw === 'string') {
        message = {
          statusCode: status,
          error: errorLabel,
          message: this.translateIfKey(i18n ?? null, raw),
        }
      } else if (typeof raw === 'object' && raw !== null) {
        const rawObj = raw as Record<string, unknown>
        const rawMsg = rawObj['message']
        let translatedMsg: unknown = rawMsg
        if (typeof rawMsg === 'string') {
          translatedMsg = this.translateIfKey(i18n ?? null, rawMsg)
        } else if (Array.isArray(rawMsg)) {
          translatedMsg = rawMsg.map(m =>
            typeof m === 'string' ? this.translateIfKey(i18n ?? null, m) : m
          )
        }
        message = { ...rawObj, error: errorLabel, message: translatedMsg }
      } else {
        message = { statusCode: status, error: errorLabel, message: errorLabel }
      }
    } else {
      const internalError =
        i18n?.t('common.errors.internalServerError') ?? 'Internal Server Error'
      message = {
        statusCode: status,
        error: internalError,
        message: (exception as Error).message || internalError,
      }
    }

    this.logger.error(
      `Http Status: ${status} Error Message: ${JSON.stringify(message)}`
    )

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'object' ? message : { message }),
    }

    response.status(status).json(responseBody)
  }
}
