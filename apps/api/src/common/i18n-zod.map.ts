import type { ZodErrorMap } from 'zod'

/**
 * Global Zod v4 error map.
 *
 * Returns raw i18n KEYS — no translation happens here.
 * Translation is deferred to AllExceptionsFilter where the full HTTP context
 * (and therefore the correct request language) is available via I18nContext.current(host).
 *
 * Fields with an explicit schema-level error (z.string({ error: 'my.key' })) bypass
 * this map entirely — Zod resolves those before calling customError.
 */
export const i18nZodErrorMap: ZodErrorMap = issue => {
  switch (issue.code) {
    case 'invalid_type':
      return {
        message:
          issue.input === undefined || issue.input === null
            ? 'common.validation.required'
            : 'common.validation.invalid',
      }

    case 'too_small': {
      const origin: string = issue.origin ?? ''
      if (origin === 'string') return { message: 'common.validation.minLength' }
      if (origin === 'array' || origin === 'set')
        return { message: 'common.validation.minItems' }
      return { message: 'common.validation.min' }
    }

    case 'too_big': {
      const origin: string = issue.origin ?? ''
      if (origin === 'string') return { message: 'common.validation.maxLength' }
      if (origin === 'array' || origin === 'set')
        return { message: 'common.validation.maxItems' }
      return { message: 'common.validation.max' }
    }

    case 'invalid_format': {
      const fmt: string = issue.format ?? ''
      if (fmt === 'email') return { message: 'common.validation.email' }
      if (fmt === 'url') return { message: 'common.validation.url' }
      if (
        fmt === 'uuid' ||
        fmt === 'uuidv4' ||
        fmt === 'uuidv6' ||
        fmt === 'guid'
      )
        return { message: 'common.validation.uuid' }
      if (fmt === 'date' || fmt === 'datetime' || fmt === 'time')
        return { message: 'common.validation.date' }
      if (fmt === 'regex') return { message: 'common.validation.pattern' }
      return { message: 'common.validation.invalid' }
    }

    case 'invalid_value':
      return { message: 'common.validation.invalid' }

    default:
      return { message: 'common.validation.invalid' }
  }
}
