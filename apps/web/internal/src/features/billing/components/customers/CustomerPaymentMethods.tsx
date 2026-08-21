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
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ResponsiveDrawer,
  toast,
} from '@rufieltics/ui'
import type { PaymentMethodView } from '@/features/billing/data/customers'
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
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-white"
        style={{ background: method.color }}
      >
        <Icon className="size-4" />
      </div>
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
        </div>
      </div>
      <span className="text-muted-foreground hidden shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] sm:inline">
        {method.provider}
      </span>
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
      <Card className="flex-1 gap-0 overflow-hidden py-0">
        <CardContent className="flex h-full flex-col p-0">
          <div className="divide-y">
            {visible.map(m => (
              <MethodRow key={m.id} method={m} />
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
        </CardContent>
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
