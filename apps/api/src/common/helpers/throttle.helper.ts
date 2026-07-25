import configuration from '@/config/configuration'

const config = configuration()

/** Shared throttle config for auth-sensitive routes. */
export const authThrottle = () => ({
  default: {
    limit: config.throttle.auth.limit,
    ttl: config.throttle.auth.ttl,
  },
})
