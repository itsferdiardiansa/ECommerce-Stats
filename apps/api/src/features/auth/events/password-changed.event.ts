export class PasswordChangedEvent {
  constructor(
    public readonly userId: number,
    public readonly ipAddress: string | null,
    public readonly location: string | null,
    public readonly device: string | null
  ) {}
}
