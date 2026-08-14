const DEFAULT_SLOW_MS = 10000
const DEFAULT_TIMEOUT_MS = 30000

let baseUrl = ''
let slowMs = DEFAULT_SLOW_MS
let timeoutMs = DEFAULT_TIMEOUT_MS

/** Set the API base URL (e.g. `http://localhost:6001/api/v1`). Call once at startup. */
export function configureApiBaseUrl(url: string) {
  baseUrl = url
}

/** Thrown for any non-2xx API response; carries the server's message + status. */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Thrown when a request exceeds the hard timeout and is aborted. */
export class TimeoutError extends Error {
  constructor(message = 'The request timed out. Please try again.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/** True when the error is an abort (timeout OR a caller-cancelled request). */
export function isAbortError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name?: string }).name === 'AbortError'
  )
}

interface ApiEnvelope<T> {
  message?: string
  data?: T
  error?: { message?: string; code?: string }
}

export interface ApiRequest extends Omit<RequestInit, 'body'> {
  /** JSON-serializable payload - sets Content-Type and serializes for you. */
  json?: unknown
  /** Raw body, when `json` isn't appropriate (form data, etc.). */
  body?: BodyInit | null
  /** Bearer token for the Authorization header. */
  token?: string
  /** Override the hard timeout for this request (ms); 0 disables it. */
  timeoutMs?: number
  /** Skip the automatic refresh-on-401 retry (used by the refresh call itself). */
  skipAuthRefresh?: boolean
}

type RefreshFn = () => Promise<string | null>
type UnauthorizedFn = () => void
type NotifyFn = () => void
type TimeoutRetryFn = (actions: {
  retry: () => void
  giveUp: () => void
}) => void

let refreshFn: RefreshFn | null = null
let unauthorizedFn: UnauthorizedFn | null = null
let onSlow: NotifyFn | null = null
let onTimeout: NotifyFn | null = null
let onTimeoutRetry: TimeoutRetryFn | null = null

export function configureApiAuth(handlers: {
  refresh: RefreshFn
  onUnauthorized: UnauthorizedFn
}) {
  refreshFn = handlers.refresh
  unauthorizedFn = handlers.onUnauthorized
}

/**
 * Configure the two-stage request timeout:
 * - `onSlow` fires when a request passes `slowMs` (default 10s) - it's still
 *   running, so surface a "this is taking a bit longer" hint.
 * - at `timeoutMs` (default 30s) the request is aborted; `onTimeout` fires (show
 *   a toast) and a `TimeoutError` is thrown.
 */
export function configureApiTimeouts(options: {
  slowMs?: number
  timeoutMs?: number
  onSlow?: NotifyFn | null
  onTimeout?: NotifyFn | null
}) {
  if (options.slowMs != null) slowMs = options.slowMs
  if (options.timeoutMs != null) timeoutMs = options.timeoutMs
  if (options.onSlow !== undefined) onSlow = options.onSlow
  if (options.onTimeout !== undefined) onTimeout = options.onTimeout
}

/** Register a retry/giveUp prompt to run when a request hits the hard timeout. */
export function configureApiTimeout(handler: TimeoutRetryFn | null) {
  onTimeoutRetry = handler
}

function accessTokenExpired(authorization: string | undefined): boolean {
  if (!authorization) return false
  const segment = authorization.slice(7).split('.')[1]
  if (!segment) return false
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    return typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000
  } catch {
    return false
  }
}

/**
 * The one place fetch lives. JSON in/out, cookie auth by default, unwraps the
 * `{ data }` envelope, throws a typed `ApiError` on failure, supports a bearer
 * token, a two-stage timeout, and a caller `signal` (abort on unmount / page
 * change / modal close). Caller-triggered aborts surface as an AbortError -
 * check `isAbortError(err)` and ignore them.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequest = {}
): Promise<T> {
  const {
    json,
    body,
    token,
    timeoutMs: requestTimeoutMs,
    headers,
    signal,
    credentials,
    skipAuthRefresh,
    ...rest
  } = options

  const controller = new AbortController()
  const forwardAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', forwardAbort, { once: true })
  }

  let timedOut = false
  const hardMs = requestTimeoutMs ?? timeoutMs
  const slowTimer =
    slowMs > 0 ? setTimeout(() => onSlow?.(), slowMs) : undefined
  const hardTimer =
    hardMs > 0
      ? setTimeout(() => {
          timedOut = true
          controller.abort()
        }, hardMs)
      : undefined

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  }
  const authenticated = 'Authorization' in baseHeaders

  const send = (requestHeaders: Record<string, string>) =>
    fetch(`${baseUrl}${path}`, {
      ...rest,
      credentials: credentials ?? 'include',
      signal: controller.signal,
      body: json !== undefined ? JSON.stringify(json) : body,
      headers: requestHeaders,
    })

  const readEnvelope = async (res: Response): Promise<ApiEnvelope<T>> => {
    try {
      return (await res.json()) as ApiEnvelope<T>
    } catch {
      return {}
    }
  }

  try {
    let res = await send(baseHeaders)
    let envelope = await readEnvelope(res)

    if (res.status === 401 && authenticated && !skipAuthRefresh && refreshFn) {
      const sessionInvalid = envelope.error?.code === 'SESSION_INVALID'
      if (sessionInvalid || accessTokenExpired(baseHeaders.Authorization)) {
        const newToken = await refreshFn()
        if (newToken) {
          res = await send({
            ...baseHeaders,
            Authorization: `Bearer ${newToken}`,
          })
          envelope = await readEnvelope(res)
        } else {
          unauthorizedFn?.()
        }
      }
    }

    if (!res.ok) {
      throw new ApiError(
        envelope.error?.message || envelope.message || 'Something went wrong.',
        res.status,
        envelope.error?.code
      )
    }

    return envelope.data as T
  } catch (err) {
    // Our own hard timeout aborted the request.
    if (timedOut) {
      if (onTimeoutRetry) {
        return await new Promise<T>((resolve, reject) => {
          onTimeoutRetry?.({
            retry: () => {
              apiFetch<T>(path, options).then(resolve, reject)
            },
            giveUp: () => reject(new TimeoutError()),
          })
        })
      }
      onTimeout?.()
      throw new TimeoutError()
    }
    // Otherwise (caller-cancelled abort, network error, ApiError) bubble up.
    throw err
  } finally {
    if (slowTimer) clearTimeout(slowTimer)
    if (hardTimer) clearTimeout(hardTimer)
    if (signal) signal.removeEventListener('abort', forwardAbort)
  }
}

/** Ergonomic verb helpers over `apiFetch`. */
export const api = {
  get: <T>(path: string, options?: ApiRequest) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, json?: unknown, options?: ApiRequest) =>
    apiFetch<T>(path, { ...options, method: 'POST', json }),
  put: <T>(path: string, json?: unknown, options?: ApiRequest) =>
    apiFetch<T>(path, { ...options, method: 'PUT', json }),
  patch: <T>(path: string, json?: unknown, options?: ApiRequest) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', json }),
  delete: <T>(path: string, options?: ApiRequest) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}
