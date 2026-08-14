import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Signing in',
  description: 'Completing your sign-in.',
}

export default function CallbackLayout({ children }: { children: ReactNode }) {
  return children
}
