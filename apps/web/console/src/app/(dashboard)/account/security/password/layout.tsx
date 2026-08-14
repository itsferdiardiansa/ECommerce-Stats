import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Password',
  description: 'Change the password you use to sign in.',
}

export default function PasswordLayout({ children }: { children: ReactNode }) {
  return children
}
