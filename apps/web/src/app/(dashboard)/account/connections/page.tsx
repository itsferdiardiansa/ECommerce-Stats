import type { Metadata } from 'next'
import { ConnectionsList } from '@/features/account/components/connections/ConnectionsList'

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Manage the accounts linked to your profile, such as Google.',
}

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Connections</h1>
        <p className="text-muted-foreground text-sm">
          Accounts linked to your profile that you can sign in with.
        </p>
      </div>
      <ConnectionsList />
    </div>
  )
}
