import { HttpStatus } from '@nestjs/common'

export interface ApiResponseOptions<T> {
  message: string
  data?: T
}

export interface PaginatedApiResponseOptions<T> {
  message: string
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  status: number
  version: string
  timestamp: string
  message: string
  data: T
}

export interface ApiErrorResponse {
  status: number
  version: string
  timestamp: string
  error: {
    message?: string
    messages?: Array<{
      field: string
      message: string
      code: string
    }>
  }
  path: string
}

const API_VERSION = 'v1'

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
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
): ApiResponse<{
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}> {
  return success(
    message,
    {
      items,
      pagination,
    },
    HttpStatus.OK
  )
}

export function error(
  statusCode: number,
  errorMessage: string,
  path: string,
  messages?: Array<{
    field: string
    message: string
    code: string
  }>
): ApiErrorResponse {
  return {
    status: statusCode,
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    path,
    error:
      messages && messages.length > 0
        ? { messages }
        : { message: errorMessage },
  }
}

export const createApiResponse = success
export const createApiErrorResponse = error
