export class StepUpVerifiedEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly location: string | null,
    public readonly device: string | null
  ) {}
}

export class StepUpBlockedEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly location: string | null,
    public readonly device: string | null
  ) {}
}
