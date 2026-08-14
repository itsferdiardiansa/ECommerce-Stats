import { HttpStatus } from '@nestjs/common'

export interface ApiResponse<T> {
  status: number
  version: string
  timestamp: string
  message: string
  data: T
}

export interface ApiValidationMessage {
  field: string
  message: string
  code: string
}

export interface ApiErrorResponse {
  status: number
  version: string
  timestamp: string
  error: {
    message?: string
    code?: string
    messages?: ApiValidationMessage[]
  }
  path: string
}

export interface ApiPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const API_VERSION = 'v1'

export function success<T>(
  message: string,
  data: T = null as T,
  statusCode: HttpStatus = HttpStatus.OK
): ApiResponse<T> {
  return {
    status: statusCode,
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    message,
    data,
  }
}

export function created<T>(message: string, data: T): ApiResponse<T> {
  return success(message, data, HttpStatus.CREATED)
}

export function paginated<T>(
  message: string,
  items: T[],
  pagination: ApiPagination
): ApiResponse<{ items: T[]; pagination: ApiPagination }> {
  return success(message, { items, pagination }, HttpStatus.OK)
}

export function error(
  statusCode: number,
  errorMessage: string,
  path: string,
  messages?: ApiValidationMessage[],
  code?: string
): ApiErrorResponse {
  return {
    status: statusCode,
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    path,
    error:
      messages && messages.length > 0
        ? { messages }
        : code
          ? { message: errorMessage, code }
          : { message: errorMessage },
  }
}
