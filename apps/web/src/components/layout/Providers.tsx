'use client'
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActiveThemeProvider } from './ActiveTheme'
import { AuthProvider } from '@/features/auth/context/AuthContext'

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
        <AuthProvider>{children}</AuthProvider>
      </ActiveThemeProvider>
    </QueryClientProvider>
  )
}
