import { PaymentLogo, cn, resolvePaymentKey } from '@rufieltics/ui'

export function ProviderLogo({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  if (!resolvePaymentKey(name)) {
    return (
      <span className={cn('text-muted-foreground text-xs', className)}>
        {name}
      </span>
    )
  }
  return <PaymentLogo name={name} className={cn('h-4', className)} />
}
