import React from 'react'
import { SudoProvider } from '@/features/account/context/SudoContext'

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
