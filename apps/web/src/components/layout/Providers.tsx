'use client'
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ActiveThemeProvider } from './ActiveTheme'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { SessionExpiredProvider } from '@/features/auth/components/SessionExpiredProvider'

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <AuthProvider>
          <SessionExpiredProvider>{children}</SessionExpiredProvider>
        </AuthProvider>
        <Toaster richColors position="bottom-right" />
      </ActiveThemeProvider>
    </QueryClientProvider>
  )
}
