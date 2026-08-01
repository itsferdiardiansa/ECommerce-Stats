export class SecurityCompromiseEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null
  ) {}
}
