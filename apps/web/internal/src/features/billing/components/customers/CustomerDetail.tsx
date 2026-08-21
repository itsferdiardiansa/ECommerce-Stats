'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { Badge, Carousel, StatCard, TONE } from '@rufieltics/ui'
import {
  CUSTOMER_HISTORY,
  getCustomer,
} from '@/features/billing/data/customers'
import { resolveBackTarget } from '@/features/billing/lib/back-target'
import { CustomerPaymentMethods } from './CustomerPaymentMethods'
import { CustomerPlanHistory } from './CustomerPlanHistory'
import { CustomerHistory } from './CustomerHistory'

export function CustomerDetail({
  slug,
  from,
}: {
  slug: string
  from?: string
}) {
  const customer = getCustomer(slug)
  const back = resolveBackTarget(from)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-lg text-lg font-semibold">
            {customer.name[0]}
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              {customer.name}
              <Badge className={TONE.success.soft}>{customer.status}</Badge>
            </h1>
            <p className="text-muted-foreground text-sm">{customer.email}</p>
          </div>
        </div>
      </div>

      <Carousel itemClassName="w-64" ariaLabel="Customer metrics">
        <StatCard
          label="Plan"
          value={customer.plan}
          hint="monthly"
          icon={CreditCard}
        />
        <StatCard
          label="Lifetime value"
          value={customer.lifetimeValue}
          delta={{ value: '6%', direction: 'up' }}
          icon={TrendingUp}
        />
        <StatCard
          label="Customer since"
          value={customer.since}
          icon={CalendarDays}
        />
        <StatCard
          label="Transactions"
          value={String(CUSTOMER_HISTORY.length)}
          hint="all time"
          icon={Receipt}
        />
      </Carousel>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <CustomerPaymentMethods
          methods={customer.methods}
          email={customer.email}
        />
        <CustomerPlanHistory events={customer.planHistory} />
      </div>

      <CustomerHistory
        rows={CUSTOMER_HISTORY}
        customerSlug={customer.slug}
        customer={{ name: customer.name, email: customer.email }}
      />
    </div>
  )
}
