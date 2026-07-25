export class RecoveryCodeUsedEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly remaining: number
  ) {}
}
