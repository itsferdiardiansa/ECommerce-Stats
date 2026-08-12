import type { Metadata } from 'next'
import { PreferencesForm } from '@/features/account/components/preferences/PreferencesForm'

export const metadata: Metadata = {
  title: 'Preferences',
  description: 'Set your language, currency, time zone, and date format.',
}

export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Preferences</h1>
        <p className="text-muted-foreground text-sm">
          Choose how dates, currency, and language appear for you.
        </p>
      </div>
      <PreferencesForm />
    </div>
  )
}
