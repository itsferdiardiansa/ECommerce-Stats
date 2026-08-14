import { isAbortError, TimeoutError } from '@/lib/api-client'

/**
 * Errors that should not surface an inline message: a caller-cancelled request
 * (page change / modal close) or a timeout (already toasted by the api client).
 */
export const isSilentError = (err: unknown) =>
  isAbortError(err) || err instanceof TimeoutError
