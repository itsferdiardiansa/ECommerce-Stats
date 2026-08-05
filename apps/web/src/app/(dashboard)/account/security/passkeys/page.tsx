import { PasskeysManager } from '@/features/account/components/PasskeysManager'

export default function PasskeysPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Passkeys</h1>
        <p className="text-muted-foreground text-sm">
          Add or remove passkeys for passwordless sign in.
        </p>
      </div>
      <PasskeysManager />
    </div>
  )
}
