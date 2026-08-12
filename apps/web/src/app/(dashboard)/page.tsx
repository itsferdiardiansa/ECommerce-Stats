import type { Metadata } from 'next'
import { Greeting } from './Greeting'

export const metadata: Metadata = {
  description: 'Your account and store at a glance.',
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="space-y-1">
        <Greeting />
        <p className="text-muted-foreground text-sm">
          You&apos;re signed in. Manage your profile and security from the
          account area.
        </p>
      </div>
    </div>
  )
}
