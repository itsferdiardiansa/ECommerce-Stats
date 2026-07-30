import configuration from '@/config/configuration'

const config = configuration()

/** Shared throttle config for auth-sensitive routes. */
export const authThrottle = () => ({
  default: {
    limit: config.throttle.auth.limit,
    ttl: config.throttle.auth.ttl,
  },
})

/** Flood-only ceiling for step-up; brute force is handled by the lockout. */
export const stepUpThrottle = () => ({
  default: {
    limit: config.throttle.stepUp.limit,
    ttl: config.throttle.stepUp.ttl,
  },
})
