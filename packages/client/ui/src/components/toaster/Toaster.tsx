'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="bottom-right"
      toastOptions={{ style: { padding: '0.625rem 0.875rem' } }}
    />
  )
}
