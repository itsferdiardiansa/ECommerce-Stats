import type { Metadata } from 'next'
import React from 'react'
import { SudoProvider } from '@/features/account/context/SudoContext'
import { appName } from '@/config/site'

export const metadata: Metadata = {
  title: {
    default: `${appName} | Profile`,
    template: `${appName} | %s`,
  },
  description: 'Manage your name, username, photo, email, and phone number.',
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SudoProvider>
      <div className="mx-auto w-full max-w-2xl px-1 py-2">{children}</div>
    </SudoProvider>
  )
}
