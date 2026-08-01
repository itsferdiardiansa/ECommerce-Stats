export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  SECURITY_ALERT: 'auth.security.alert',
  SECURITY_COMPROMISE: 'auth.security.compromise',
  STEP_UP_VERIFIED: 'auth.stepup.verified',
  STEP_UP_BLOCKED: 'auth.stepup.blocked',
  PASSWORD_CHANGED: 'auth.password.changed',
  SECURITY_METHOD_CHANGED: 'auth.security.method_changed',
  RECOVERY_CODE_USED: 'auth.security.recovery_code_used',
  TWO_FACTOR_ENABLED: 'auth.mfa.enabled',
} as const

export { LoginSuccessEvent } from './login-success.event'
export type { LoginGeo } from './login-success.event'
export { LoginFailedEvent } from './login-failed.event'
export { SecurityAlertEvent } from './security-alert.event'
export { SecurityCompromiseEvent } from './security-compromise.event'
export { StepUpVerifiedEvent, StepUpBlockedEvent } from './step-up.event'
export { PasswordChangedEvent } from './password-changed.event'
export { SecurityMethodChangedEvent } from './security-method.event'
export { RecoveryCodeUsedEvent } from './recovery-code.event'
export { TwoFactorEnabledEvent } from './mfa-enabled.event'
