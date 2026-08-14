import {
  configureApiBaseUrl,
  configureApiTimeouts,
} from '@rufieltics/api-client'
import { toast } from '@rufieltics/ui'

configureApiBaseUrl(
  process.env.NEXT_PUBLIC_PLATFORM_API_URL ?? 'http://localhost:6002/api/v1'
)

configureApiTimeouts({
  onSlow: () => toast('The process might take a bit longer…'),
  onTimeout: () => toast.error('The request timed out. Please try again.'),
})

export * from '@rufieltics/api-client'
