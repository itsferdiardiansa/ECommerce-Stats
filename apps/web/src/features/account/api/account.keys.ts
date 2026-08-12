export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  sessions: () => [...accountKeys.all, 'sessions'] as const,
  mfa: () => [...accountKeys.all, 'mfa'] as const,
  sudo: () => [...accountKeys.all, 'sudo'] as const,
  settings: () => [...accountKeys.all, 'settings'] as const,
  addresses: () => [...accountKeys.all, 'addresses'] as const,
  activity: () => [...accountKeys.all, 'activity'] as const,
  connections: () => [...accountKeys.all, 'connections'] as const,
}
