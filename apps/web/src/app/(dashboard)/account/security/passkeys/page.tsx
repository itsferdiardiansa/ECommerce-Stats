import { SecuritySettings } from '@/features/auth/components/SecuritySettings'

export default function PasskeysPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Passkeys</h1>
        <p className="text-muted-foreground text-sm">
          Add or remove passkeys for passwordless sign in.
        </p>
      </div>
      <SecuritySettings />
    </div>
  )
}
