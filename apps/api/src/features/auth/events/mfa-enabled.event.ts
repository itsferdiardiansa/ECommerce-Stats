export class TwoFactorEnabledEvent {
  constructor(
    public readonly userId: number,
    public readonly currentJti: string
  ) {}
}
