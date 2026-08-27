'use client'

import { useState } from 'react'
import { ShieldCheck, Webhook } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  DashboardContentShell,
  SectionShell,
} from '@rufieltics/ui'
import {
  PROVIDERS,
  WEBHOOK_HOURS,
  WEBHOOK_SERIES,
} from '@/features/billing/data/providers'
import { TrendChartCard } from '@/features/billing/components/shared/TrendChartCard'
import { ProviderCard } from './ProviderCard'

const WEBHOOK_TABS = WEBHOOK_SERIES.map(series => ({
  value: series.name,
  label: series.name,
}))

export function PaymentProvidersPage() {
  const [webhookProvider, setWebhookProvider] = useState(WEBHOOK_SERIES[0].name)
  const series =
    WEBHOOK_SERIES.find(item => item.name === webhookProvider) ??
    WEBHOOK_SERIES[0]

  return (
    <DashboardContentShell
      title="Payment providers"
      subTitle="Connection health and enabled methods across your providers."
      alert={
        <Alert variant="info">
          <ShieldCheck className="size-4" />
          <AlertDescription>
            <p>
              API keys are managed in your secret manager, not here. This page
              is read-only - it shows status resolved from{' '}
              <span className="font-mono text-xs">secretRef</span> aliases.
            </p>
          </AlertDescription>
        </Alert>
      }
    >
      <SectionShell>
        <TrendChartCard
          title="Webhook events"
          icon={Webhook}
          categories={WEBHOOK_HOURS}
          data={series.data}
          name={series.name}
          formatValue={value => String(value)}
          height={220}
          tabs={WEBHOOK_TABS}
          tabValue={webhookProvider}
          onTabChange={setWebhookProvider}
        />
      </SectionShell>

      <SectionShell>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PROVIDERS.map(provider => (
            <ProviderCard key={provider.key} provider={provider} />
          ))}
        </div>
      </SectionShell>
    </DashboardContentShell>
  )
}
