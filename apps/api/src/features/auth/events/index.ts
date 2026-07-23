export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  SECURITY_ALERT: 'auth.security.alert',
  SECURITY_COMPROMISE: 'auth.security.compromise',
  STEP_UP_VERIFIED: 'auth.stepup.verified',
  STEP_UP_BLOCKED: 'auth.stepup.blocked',
} as const

export { LoginSuccessEvent } from './login-success.event'
export type { LoginGeo } from './login-success.event'
export { LoginFailedEvent } from './login-failed.event'
export { SecurityAlertEvent } from './security-alert.event'
export { SecurityCompromiseEvent } from './security-compromise.event'
export { StepUpVerifiedEvent, StepUpBlockedEvent } from './step-up.event'
