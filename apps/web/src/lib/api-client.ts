import { env } from '@/config/env'

const BASE_URL = env.apiUrl

const DEFAULT_TIMEOUT_MS = 15000

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

/** Thrown when a request exceeds its timeout and the user doesn't retry. */
export class TimeoutError extends Error {
  constructor(message = 'The request timed out.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

interface ApiEnvelope<T> {
  message?: string
  data?: T
  error?: { message?: string; code?: string }
}

export interface ApiRequest extends Omit<RequestInit, 'body'> {
  /** JSON-serializable payload — sets Content-Type and serializes for you. */
  json?: unknown
  /** Raw body, when `json` isn't appropriate (form data, etc.). */
  body?: BodyInit | null
  /** Bearer token for the Authorization header. */
  token?: string
  /** Abort after this many ms. Defaults to 15s; pass 0 to disable. */
  timeoutMs?: number
  /** Skip the automatic refresh-on-401 retry (used by the refresh call itself). */
  skipAuthRefresh?: boolean
  /** Skip the timeout retry prompt; a plain TimeoutError is thrown instead. */
  skipTimeoutPrompt?: boolean
}

type RefreshFn = () => Promise<string | null>
type UnauthorizedFn = () => void
type TimeoutFn = (actions: { retry: () => void; giveUp: () => void }) => void

let refreshFn: RefreshFn | null = null
let unauthorizedFn: UnauthorizedFn | null = null
let timeoutFn: TimeoutFn | null = null

export function configureApiAuth(handlers: {
  refresh: RefreshFn
  onUnauthorized: UnauthorizedFn
}) {
  refreshFn = handlers.refresh
  unauthorizedFn = handlers.onUnauthorized
}

/** Wire up how a request timeout surfaces to the user (e.g. a retry toast). */
export function configureApiTimeout(handler: TimeoutFn | null) {
  timeoutFn = handler
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
 * `{ data }` envelope, throws a typed `ApiError` on failure, and supports a
 * bearer token and a timeout. Works in both server and client components; pass
 * `cache`/`next`/`credentials` through `options` as needed.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequest = {}
): Promise<T> {
  const {
    json,
    body,
    token,
    timeoutMs,
    headers,
    signal,
    credentials,
    skipAuthRefresh,
    skipTimeoutPrompt,
    ...rest
  } = options

  const effectiveTimeout =
    timeoutMs === 0 ? undefined : (timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const useOwnTimeout = signal == null && effectiveTimeout != null
  let timedOut = false
  const controller = useOwnTimeout ? new AbortController() : undefined
  const timer = controller
    ? setTimeout(() => {
        timedOut = true
        controller.abort()
      }, effectiveTimeout)
    : undefined

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  }
  const authenticated = 'Authorization' in baseHeaders

  const send = (requestHeaders: Record<string, string>) =>
    fetch(`${BASE_URL}${path}`, {
      ...rest,
      credentials: credentials ?? 'include',
      signal: signal ?? controller?.signal,
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
    const aborted = (err as { name?: string } | null)?.name === 'AbortError'
    const isTimeout = timedOut && aborted
    if (!isTimeout) throw err
    if (skipTimeoutPrompt || !timeoutFn) throw new TimeoutError()
    return await new Promise<T>((resolve, reject) => {
      timeoutFn?.({
        retry: () => {
          apiFetch<T>(path, options).then(resolve, reject)
        },
        giveUp: () => reject(new TimeoutError()),
      })
    })
  } finally {
    if (timer) clearTimeout(timer)
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
