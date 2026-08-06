import type { Metadata } from 'next'
import { AddressBook } from '@/features/account/components/AddressBook'

export const metadata: Metadata = {
  title: 'Addresses',
  description: 'Manage your shipping and billing addresses.',
}

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Addresses</h1>
        <p className="text-muted-foreground text-sm">
          Manage the addresses used for shipping and billing.
        </p>
      </div>
      <AddressBook />
    </div>
  )
}
