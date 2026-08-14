import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Toaster } from '@rufieltics/ui'
import { AuthProvider } from '@/features/auth/context'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Rufieltics Admin',
    template: 'Rufieltics Admin | %s',
  },
  description: 'Internal platform administration console.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
