const DEV_DEFAULTS: Record<string, string> = {
  JWT_ACCESS_SECRET: 'rufieltics-access-secret-change-in-production',
  JWT_REFRESH_SECRET: 'rufieltics-refresh-secret-change-in-production',
}

const MIN_SECRET_LENGTH = 32

/** Fails fast in production when a required secret is missing, default or weak. */
export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'production') return

  const problems: string[] = []

  for (const [key, devDefault] of Object.entries(DEV_DEFAULTS)) {
    const value = env[key]

    if (!value) {
      problems.push(`${key} is not set`)
    } else if (value === devDefault) {
      problems.push(`${key} still uses the development default`)
    } else if (value.length < MIN_SECRET_LENGTH) {
      problems.push(`${key} is shorter than ${MIN_SECRET_LENGTH} characters`)
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Refusing to start in production: ${problems.join('; ')}. ` +
        'Set these in the environment, never in code.'
    )
  }
}
