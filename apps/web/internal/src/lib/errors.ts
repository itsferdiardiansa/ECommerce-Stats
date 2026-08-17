import { ApiError, isAbortError, TimeoutError } from '@/lib/api-client'

/**
 * Errors that should not surface an inline message: a caller-cancelled request
 * (page change / modal close), a timeout (already toasted by the api client),
 * or an expired session (the session-expired modal already handles it).
 */
export const isSilentError = (err: unknown) =>
  isAbortError(err) ||
  err instanceof TimeoutError ||
  (err instanceof ApiError && err.code === 'SESSION_INVALID')
