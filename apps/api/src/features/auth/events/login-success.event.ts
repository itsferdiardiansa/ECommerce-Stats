export interface LoginGeo {
  latitude: number | null
  longitude: number | null
  city: string | null
  region: string | null
  country: string | null
}

export class LoginSuccessEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly deviceFingerprint: string,
    public readonly geo: LoginGeo,
    // True when the login passed an email-OTP step-up challenge - the user has
    // already confirmed the risky sign-in, so no "suspicious login" alert is sent.
    public readonly stepUpVerified = false
  ) {}
}
