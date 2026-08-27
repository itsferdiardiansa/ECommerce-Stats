'use client'

import {
  Coins,
  CreditCard,
  ExternalLink,
  KeyRound,
  Webhook,
} from 'lucide-react'
import {
  Badge,
  Card,
  PaymentLogo,
  TONE,
  cn,
  resolvePaymentKey,
  type Tone,
} from '@rufieltics/ui'
import { DetailField } from '@/features/billing/components/shared/DetailField'
import type { PaymentProviderView } from '@/features/billing/data/providers'

const STATUS: Record<
  PaymentProviderView['status'],
  { label: string; tone: Tone }
> = {
  connected: { label: 'Connected', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  disconnected: { label: 'Not connected', tone: 'neutral' },
}

export function ProviderCard({ provider }: { provider: PaymentProviderView }) {
  const status = STATUS[provider.status]
  const connected = provider.status !== 'disconnected'

  return (
    <Card>
      <Card.Content className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center">
            {resolvePaymentKey(provider.name) ? (
              <PaymentLogo name={provider.name} className="h-6" />
            ) : (
              <span className="bg-muted flex size-9 items-center justify-center rounded-md text-sm font-bold">
                {provider.name[0]}
              </span>
            )}
          </span>
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

        <section className="space-y-3">
          <DetailField icon={KeyRound} label="Secret ref">
            <span className="text-muted-foreground font-mono text-xs">
              {provider.secretRef}
            </span>
          </DetailField>
          <DetailField icon={Webhook} label="Webhook">
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
          </DetailField>
          <DetailField icon={Coins} label="Currencies">
            <span className="font-mono tabular-nums">
              {provider.currencies.join(', ')}
            </span>
          </DetailField>
          <DetailField icon={CreditCard} label="Methods">
            <span className="flex flex-wrap justify-end gap-1.5">
              {provider.methods.map(method => (
                <Badge
                  key={method.label}
                  variant={method.enabled ? 'info' : 'secondary'}
                  className="text-[11px]"
                >
                  {method.label}
                </Badge>
              ))}
            </span>
          </DetailField>
        </section>

        <a
          href="#"
          onClick={event => event.preventDefault()}
          className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          Manage keys in secret manager
          <ExternalLink className="size-3" />
        </a>
      </Card.Content>
    </Card>
  )
}
