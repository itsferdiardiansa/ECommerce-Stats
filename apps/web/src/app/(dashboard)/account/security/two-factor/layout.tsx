import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Two factor',
  description: 'Set up an authenticator app for a second sign-in step.',
}

export default function TwoFactorLayout({ children }: { children: ReactNode }) {
  return children
}
