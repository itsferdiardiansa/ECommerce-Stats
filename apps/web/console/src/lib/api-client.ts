import { configureApiBaseUrl } from '@rufieltics/api-client'
import { env } from '@/config/env'

configureApiBaseUrl(env.apiUrl)

export * from '@rufieltics/api-client'
