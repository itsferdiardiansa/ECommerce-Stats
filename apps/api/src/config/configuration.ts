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
    stepUp: {
      ttl: parseInt(process.env.THROTTLE_STEP_UP_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_STEP_UP_LIMIT || '60', 10),
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
    password: {
      minAgeSeconds: parseInt(
        process.env.PASSWORD_MIN_AGE_SECONDS || '3600',
        10
      ),
    },
    passwordReset: {
      codeTtlSeconds: parseInt(
        process.env.PASSWORD_RESET_CODE_TTL_SECONDS || '900',
        10
      ),
      maxAttempts: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS || '5', 10),
      resetUrl:
        process.env.PASSWORD_RESET_URL ||
        'http://localhost:3000/reset-password',
    },
    emailChange: {
      codeTtlSeconds: parseInt(
        process.env.EMAIL_CHANGE_CODE_TTL_SECONDS || '900',
        10
      ),
      maxAttempts: parseInt(process.env.EMAIL_CHANGE_MAX_ATTEMPTS || '5', 10),
    },
    secureAccount: {
      url:
        process.env.SECURE_ACCOUNT_URL ||
        'http://localhost:3000/secure-account',
      ttlSeconds: parseInt(
        process.env.SECURE_ACCOUNT_TTL_SECONDS || '259200',
        10
      ),
    },
    loginHistory: {
      retentionDays: parseInt(
        process.env.LOGIN_HISTORY_RETENTION_DAYS || '90',
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
      maxUserFailures: parseInt(
        process.env.STEP_UP_MAX_USER_FAILURES || '10',
        10
      ),
      lockoutSeconds: parseInt(
        process.env.STEP_UP_LOCKOUT_SECONDS || '900',
        10
      ),
      lockoutLadderSeconds: (
        process.env.STEP_UP_LOCKOUT_LADDER || '900,3600,21600,86400'
      )
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => n > 0),
      lockLevelTtlSeconds: parseInt(
        process.env.STEP_UP_LOCK_LEVEL_TTL_SECONDS || '86400',
        10
      ),
    },
    totp: {
      // AES-256-GCM key for the stored TOTP secret. Generate with:
      // openssl rand -hex 32
      encryptionKey: process.env.TOTP_ENCRYPTION_KEY || '',
      issuer: process.env.TOTP_ISSUER || 'Rufieltics',
      // Steps of clock drift tolerated either side of now (1 = +/-30s).
      window: parseInt(process.env.TOTP_WINDOW || '1', 10),
      recoveryCodeCount: parseInt(process.env.RECOVERY_CODE_COUNT || '10', 10),
      enrolmentTtlSeconds: parseInt(
        process.env.TOTP_ENROLMENT_TTL_SECONDS || '900',
        10
      ),
    },
    sudo: {
      // How long a re-authentication stays valid for sensitive actions.
      ttlSeconds: parseInt(process.env.SUDO_TTL_SECONDS || '300', 10),
      maxAttempts: parseInt(process.env.SUDO_MAX_ATTEMPTS || '5', 10),
    },
    trustedDevice: {
      // How long "remember this browser" lasts once the user opts in.
      ttlSeconds: parseInt(
        process.env.TRUSTED_DEVICE_TTL_SECONDS || '2592000',
        10
      ),
    },
    webauthn: {
      // RP ID is the credential's domain: `localhost` in dev, the registrable
      // parent (e.g. `rufieltics.com`) in prod -- never the API subdomain.
      rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
      rpName: process.env.WEBAUTHN_RP_NAME || 'Rufieltics',
      // Exact origin(s) where the ceremony runs (the web app). Comma-separated
      // to allow more than one (e.g. dev + preview).
      origins: (process.env.WEBAUTHN_ORIGIN || 'http://localhost:6001')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean),
      challengeTtlSeconds: parseInt(
        process.env.WEBAUTHN_CHALLENGE_TTL_SECONDS || '120',
        10
      ),
    },
    oauth: {
      successRedirect:
        process.env.OAUTH_SUCCESS_REDIRECT ||
        'http://localhost:3000/auth/callback',
      failureRedirect:
        process.env.OAUTH_FAILURE_REDIRECT ||
        'http://localhost:3000/sign-in?error=oauth',
      stateTtlSeconds: parseInt(
        process.env.OAUTH_STATE_TTL_SECONDS || '600',
        10
      ),
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri:
          process.env.GOOGLE_REDIRECT_URI ||
          'http://localhost:6001/api/v1/auth/oauth/google/callback',
      },
    },
  },
  geo: {
    ipinfoToken: process.env.IPINFO_TOKEN || '',
  },
})
