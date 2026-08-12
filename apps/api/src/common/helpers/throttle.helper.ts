import configuration from '@/config/configuration'

const config = configuration()

/** Shared throttle config for auth-sensitive routes. */
export const authThrottle = () => ({
  default: {
    limit: config.throttle.auth.limit,
    ttl: config.throttle.auth.ttl,
  },
})

/**
 * WebAuthn login routes: the assertion is self-protecting (no valid credential,
 * no valid signature), so these get a generous ceiling rather than the strict
 * password bucket - conditional-UI arming + explicit attempts add up fast.
 */
export const passkeyThrottle = () => ({
  default: {
    limit: config.throttle.passkey.limit,
    ttl: config.throttle.passkey.ttl,
  },
})

/** Flood-only ceiling for step-up; brute force is handled by the lockout. */
export const stepUpThrottle = () => ({
  default: {
    limit: config.throttle.stepUp.limit,
    ttl: config.throttle.stepUp.ttl,
  },
})
