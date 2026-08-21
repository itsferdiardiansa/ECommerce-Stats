'use client'

import { ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, Card, CardContent } from '@rufieltics/ui'
import { AreaLineChart } from '@rufieltics/ui/charts'
import {
  PROVIDERS,
  WEBHOOK_HOURS,
  WEBHOOK_SERIES,
} from '@/features/billing/data/providers'
import { ProviderCard } from './ProviderCard'

export function PaymentProvidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payment providers</h1>
        <p className="text-muted-foreground text-sm">
          Connection health and enabled methods across your providers.
        </p>
      </div>

      <Alert>
        <ShieldCheck className="size-4" />
        <AlertDescription>
          API keys are managed in your secret manager, not here. This page is
          read-only - it shows status resolved from{' '}
          <span className="font-mono text-xs">secretRef</span> aliases.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Webhook events</h2>
            <span className="text-muted-foreground text-xs">last 24 hours</span>
          </div>
          <AreaLineChart
            categories={WEBHOOK_HOURS}
            series={WEBHOOK_SERIES}
            height={220}
            showLegend
            valueFormatter={v => `${v}`}
            ariaLabel="Webhook events received per provider over the last 24 hours"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROVIDERS.map(p => (
          <ProviderCard key={p.key} provider={p} />
        ))}
      </div>
    </div>
  )
}
