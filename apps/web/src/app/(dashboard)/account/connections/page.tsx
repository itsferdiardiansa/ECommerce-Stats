import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Manage the accounts linked to your profile, such as Google.',
}

export default function ConnectionsPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold">Connections</h1>
      <p className="text-muted-foreground text-sm">
        Manage the accounts linked to your profile, such as Google.
      </p>
    </div>
  )
}
