import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main
      id="main"
      className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center overflow-y-auto px-4 py-10"
    >
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
