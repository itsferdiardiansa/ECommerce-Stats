import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'

const SENSITIVE_FIELDS = [
  'emailVerifiedAt',
  'phoneVerifiedAt',
  'passwordChangedAt',
  'lastLoginAt',
  'isTwoFactorEnabled',
  'isStaff',
  'isActive',
  'deletedAt',
]

function isPrivilegedCaller(user?: CurrentUserPayload): boolean {
  if (!user) return false
  if (user.isStaff) return true
  return user.role === 'OWNER' || user.role === 'ADMIN'
}

function stripFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }
  for (const field of SENSITIVE_FIELDS) {
    delete result[field]
  }
  return result
}

function sanitize(data: unknown, privileged: boolean): unknown {
  if (!data || privileged) return data

  if (Array.isArray(data)) {
    return data.map(item => sanitize(item, privileged))
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>

    if ('email' in obj || 'username' in obj) {
      const stripped = stripFields(obj)
      for (const key of Object.keys(stripped)) {
        stripped[key] = sanitize(stripped[key], privileged)
      }
      return stripped
    }

    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      result[key] = sanitize(obj[key], privileged)
    }
    return result
  }

  return data
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUserPayload }>()
    const privileged = isPrivilegedCaller(request.user)

    return next.handle().pipe(
      map(response => {
        if (response && typeof response === 'object' && 'data' in response) {
          const r = response as Record<string, unknown>
          return { ...r, data: sanitize(r.data, privileged) }
        }
        return response
      })
    )
  }
}
