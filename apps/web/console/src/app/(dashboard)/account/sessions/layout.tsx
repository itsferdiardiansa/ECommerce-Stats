import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sessions',
  description: 'Review and sign out devices signed in to your account.',
}

export default function SessionsLayout({ children }: { children: ReactNode }) {
  return children
}
