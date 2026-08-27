import type { ReactNode } from 'react'
import { CreditCard } from 'lucide-react'
import { PaymentLogo, resolvePaymentKey } from '@rufieltics/ui'
import { ProviderLogo } from './ProviderLogo'

export function PaymentMethodRow({
  method,
  provider,
  subtitle,
}: {
  method: string
  provider: string
  subtitle: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center">
        {resolvePaymentKey(method) ? (
          <PaymentLogo name={method} className="h-6" />
        ) : (
          <CreditCard className="text-muted-foreground size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{method}</div>
        <div className="text-muted-foreground text-xs">{subtitle}</div>
      </div>
      <ProviderLogo name={provider} className="shrink-0" />
    </div>
  )
}
