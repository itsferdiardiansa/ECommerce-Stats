import type { ReactNode } from 'react'
import { Badge, TONE, cn, type Tone } from '@rufieltics/ui'

export type TxnStatusTone = 'good' | 'bad' | 'warn' | 'info' | 'neutral'

const TO_TONE: Record<TxnStatusTone, Tone> = {
  good: 'success',
  bad: 'destructive',
  warn: 'warning',
  info: 'info',
  neutral: 'neutral',
}

export function TxnStatusBadge({
  tone,
  children,
}: {
  tone: TxnStatusTone
  children: ReactNode
}) {
  return (
    <Badge className={cn('border-transparent', TONE[TO_TONE[tone]].soft)}>
      {children}
    </Badge>
  )
}
