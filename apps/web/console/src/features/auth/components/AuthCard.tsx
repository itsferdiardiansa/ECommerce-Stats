import React from 'react'

interface AuthCardProps {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <section className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm sm:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="text-muted-foreground mt-6 text-center text-sm">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
