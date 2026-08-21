'use client'

import { ExternalLink, Lock } from 'lucide-react'
import { Badge, Card, CardContent, TONE, cn, type Tone } from '@rufieltics/ui'
import type { PaymentProviderView } from '@/features/billing/data/providers'

const STATUS: Record<
  PaymentProviderView['status'],
  { label: string; tone: Tone }
> = {
  connected: { label: 'Connected', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  disconnected: { label: 'Not connected', tone: 'neutral' },
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t py-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}

export function ProviderCard({ provider }: { provider: PaymentProviderView }) {
  const status = STATUS[provider.status]
  const connected = provider.status !== 'disconnected'

  return (
    <Card>
      <CardContent className="space-y-1">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ background: provider.accent }}
          >
            {provider.name[0]}
          </div>
          <div className="min-w-0">
            <div className="font-semibold">{provider.name}</div>
            <div className="text-muted-foreground text-xs">
              {provider.blurb}
            </div>
          </div>
          <Badge className={cn('ml-auto capitalize', TONE[status.tone].soft)}>
            {provider.mode} · {status.label}
          </Badge>
        </div>

        <Row label="Secret ref">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <Lock className="size-3" />
            {provider.secretRef}
          </span>
        </Row>
        <Row label="Webhook">
          {connected ? (
            <span>
              last event {provider.webhookLastEvent} ·{' '}
              <span
                className={
                  provider.webhookFailures
                    ? TONE.destructive.text
                    : 'text-muted-foreground'
                }
              >
                {provider.webhookFailures} failed
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">not receiving</span>
          )}
        </Row>
        <Row label="Currencies">
          <span className="font-mono tabular-nums">
            {provider.currencies.join(', ')}
          </span>
        </Row>
        <Row label="Methods">
          <span className="flex flex-wrap justify-end gap-1.5">
            {provider.methods.map(m => (
              <span
                key={m.label}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  m.enabled
                    ? TONE.success.soft
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {m.label}
              </span>
            ))}
          </span>
        </Row>

        <div className="border-t pt-3">
          <a
            href="#"
            onClick={e => e.preventDefault()}
            className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            Manage keys in secret manager
            <ExternalLink className="size-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
