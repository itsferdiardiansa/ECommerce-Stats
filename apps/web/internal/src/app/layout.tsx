import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SessionExpiredProvider, Toaster } from '@rufieltics/ui'
import { AuthProvider } from '@/features/auth/context'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '@rufieltics',
    template: '@rufieltics | %s',
  },
  description: 'Internal platform administration console.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <SessionExpiredProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionExpiredProvider>
        <Toaster />
      </body>
    </html>
  )
}
