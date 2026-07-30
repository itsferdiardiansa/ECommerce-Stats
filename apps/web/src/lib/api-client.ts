const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:6001/api/v1'

/** Thrown for any non-2xx API response; carries the server's message + status. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiEnvelope<T> {
  message?: string
  data?: T
  error?: { message?: string }
}

/**
 * Thin fetch wrapper: sends/receives JSON, includes cookies (the API sets
 * httpOnly refresh/deviceSecret cookies), unwraps the `{ data }` envelope, and
 * throws a typed `ApiError` carrying the server message on failure.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  let body: ApiEnvelope<T> = {}
  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    const message =
      body.error?.message || body.message || 'Something went wrong.'
    throw new ApiError(message, res.status)
  }

  return body.data as T
}
