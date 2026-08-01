const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:6001/api/v1',
  google: {
    enabled: process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true',
  },
  captcha: {
    turnstileSiteKey,
    enabled: turnstileSiteKey.length > 0,
  },
} as const
