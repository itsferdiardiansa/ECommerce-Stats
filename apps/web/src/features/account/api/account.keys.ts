export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  sessions: () => [...accountKeys.all, 'sessions'] as const,
  mfa: () => [...accountKeys.all, 'mfa'] as const,
  sudo: () => [...accountKeys.all, 'sudo'] as const,
}
