'use client'

import { useState } from 'react'
import {
  CreditCard,
  Landmark,
  MoreHorizontal,
  Plus,
  Wallet,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PaymentLogo,
  ResponsiveDrawer,
  resolvePaymentKey,
  toast,
} from '@rufieltics/ui'
import type { PaymentMethodView } from '@/features/billing/data/customers'
import { ProviderLogo } from '@/features/billing/components/shared/ProviderLogo'
import { AddMethodDialog } from './AddMethodDialog'

const KIND_ICON = {
  ewallet: Wallet,
  card: CreditCard,
  va: Landmark,
}

const LIMIT = 3

function MethodRow({ method }: { method: PaymentMethodView }) {
  const Icon = KIND_ICON[method.kind]
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center">
        {resolvePaymentKey(method.label) ? (
          <PaymentLogo name={method.label} className="h-6" />
        ) : (
          <Icon className="text-muted-foreground size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{method.label}</span>
          {method.isDefault ? (
            <Badge
              variant="outline"
              className="text-[10px] tracking-wide uppercase"
            >
              Default
            </Badge>
          ) : null}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {method.detail}
          {method.expires ? ` · exp ${method.expires}` : ''}
        </div>
      </div>
      <ProviderLogo
        name={method.provider}
        className="hidden shrink-0 sm:block"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Method actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={method.isDefault}
            onClick={() => toast.success(`${method.label} set as default`)}
          >
            Set as default
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => toast(`${method.label} removed`)}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function CustomerPaymentMethods({
  methods,
  email,
}: {
  methods: PaymentMethodView[]
  email: string
}) {
  const [adding, setAdding] = useState(false)
  const [seeAll, setSeeAll] = useState(false)
  const visible = methods.slice(0, LIMIT)
  const hidden = methods.length - LIMIT

  return (
    <section className="flex flex-col gap-3">
      <div className="flex h-8 items-center justify-between">
        <h2 className="text-sm font-medium">Payment methods</h2>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Add method
        </Button>
      </div>
      <Card padding="none" className="flex-1 overflow-hidden">
        <Card.Content className="flex h-full flex-col">
          <div className="divide-y">
            {visible.map(item => (
              <MethodRow key={item.id} method={item} />
            ))}
          </div>
          {hidden > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSeeAll(true)}
              className="text-muted-foreground mt-auto w-full justify-center rounded-none border-t"
            >
              See all {methods.length} methods
            </Button>
          ) : null}
        </Card.Content>
      </Card>

      <AddMethodDialog email={email} open={adding} onOpenChange={setAdding} />

      <ResponsiveDrawer
        open={seeAll}
        onOpenChange={setSeeAll}
        title="Payment methods"
        description={`${methods.length} on file`}
      >
        <div className="divide-y">
          {methods.map(m => (
            <MethodRow key={m.id} method={m} />
          ))}
        </div>
      </ResponsiveDrawer>
    </section>
  )
}
