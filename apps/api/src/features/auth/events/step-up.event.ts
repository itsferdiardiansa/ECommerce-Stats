/** A risky login cleared the email-OTP step-up (new device now trusted). */
export class StepUpVerifiedEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly country: string | null
  ) {}
}

/**
 * A step-up challenge was failed/voided — someone had the correct password but
 * could not pass the OTP. The strongest signal that an account's password is
 * compromised.
 */
export class StepUpBlockedEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly country: string | null
  ) {}
}
