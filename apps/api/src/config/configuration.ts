export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin:
      process.env.CORS_ORIGIN === 'true'
        ? true
        : process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  throttle: {
    global: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10),
    },
    auth: {
      ttl: parseInt(process.env.THROTTLE_AUTH_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5', 10),
    },
  },
  security: {
    bruteForce: {
      windowSeconds: parseInt(
        process.env.BRUTE_FORCE_WINDOW_SECONDS || '900',
        10
      ),
      threshold: parseInt(process.env.BRUTE_FORCE_THRESHOLD || '5', 10),
    },
    impossibleTravelKmh: parseInt(
      process.env.IMPOSSIBLE_TRAVEL_KMH || '900',
      10
    ),
    knownFactorTtlSeconds: parseInt(
      process.env.KNOWN_FACTOR_TTL_SECONDS || '7776000',
      10
    ),
    notificationDedupeTtlSeconds: parseInt(
      process.env.NOTIFICATION_DEDUPE_TTL_SECONDS || '86400',
      10
    ),
    verification: {
      codeTtlSeconds: parseInt(
        process.env.VERIFICATION_CODE_TTL_SECONDS || '300',
        10
      ),
      maxAttempts: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS || '5', 10),
      lockoutSeconds: parseInt(
        process.env.VERIFICATION_LOCKOUT_SECONDS || '3600',
        10
      ),
    },
    stepUp: {
      codeTtlSeconds: parseInt(
        process.env.STEP_UP_CODE_TTL_SECONDS || '300',
        10
      ),
      maxAttempts: parseInt(process.env.STEP_UP_MAX_ATTEMPTS || '5', 10),
      challengeTtlSeconds: parseInt(
        process.env.STEP_UP_CHALLENGE_TTL_SECONDS || '600',
        10
      ),
    },
  },
})
