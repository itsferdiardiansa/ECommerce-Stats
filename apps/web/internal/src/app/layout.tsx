import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { SessionExpiredProvider, Toaster } from '@rufieltics/ui'
import { AuthProvider } from '@/features/auth/context'
import './globals.css'

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans-app',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-app',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '@rufieltics',
    template: '@rufieltics | %s',
  },
  description: 'Internal platform administration console.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="bg-background text-foreground min-h-screen antialiased">
        <SessionExpiredProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionExpiredProvider>
        <Toaster />
      </body>
    </html>
  )
}
