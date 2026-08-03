import { env } from '@/config/env'

const BASE_URL = env.apiUrl

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
  /** Abort the request after this many milliseconds. */
  timeoutMs?: number
  /** Skip the automatic refresh-on-401 retry (used by the refresh call itself). */
  skipAuthRefresh?: boolean
}

type RefreshFn = () => Promise<string | null>
type UnauthorizedFn = () => void

let refreshFn: RefreshFn | null = null
let unauthorizedFn: UnauthorizedFn | null = null

export function configureApiAuth(handlers: {
  refresh: RefreshFn
  onUnauthorized: UnauthorizedFn
}) {
  refreshFn = handlers.refresh
  unauthorizedFn = handlers.onUnauthorized
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
    ...rest
  } = options

  const controller = timeoutMs != null ? new AbortController() : undefined
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
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

  try {
    let res = await send(baseHeaders)

    if (res.status === 401 && authenticated && !skipAuthRefresh && refreshFn) {
      const newToken = await refreshFn()
      if (newToken) {
        res = await send({
          ...baseHeaders,
          Authorization: `Bearer ${newToken}`,
        })
      } else {
        unauthorizedFn?.()
      }
    }

    let envelope: ApiEnvelope<T> = {}
    try {
      envelope = (await res.json()) as ApiEnvelope<T>
    } catch {
      // no/invalid JSON body
    }

    if (!res.ok) {
      throw new ApiError(
        envelope.error?.message || envelope.message || 'Something went wrong.',
        res.status,
        envelope.error?.code
      )
    }

    return envelope.data as T
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
