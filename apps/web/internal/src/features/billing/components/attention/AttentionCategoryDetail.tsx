'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Carousel,
  DataTable,
  Input,
  SelectField,
  StatCard,
  toast,
  useDebouncedValue,
  usePagination,
} from '@rufieltics/ui'
import { slugify } from '@rufieltics/core-client'
import { attentionColumns } from '@/features/billing/configs/attention'
import type { AttentionCategory } from '@/features/billing/data/attention'
import { ATTENTION_ICON } from './attention-icons'

const RISK_OPTIONS = [
  { value: 'ALL', label: 'All risk' },
  { value: 'high', label: 'High risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'low', label: 'Low risk' },
]

export function AttentionCategoryDetail({
  category,
}: {
  category: AttentionCategory
}) {
  const router = useRouter()
  const Icon = ATTENTION_ICON[category.key]
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('ALL')
  const [provider, setProvider] = useState('ALL')
  const debounced = useDebouncedValue(search, 250)

  const providers = useMemo(
    () => Array.from(new Set(category.accounts.map(a => a.provider))),
    [category.accounts]
  )

  const rows = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return category.accounts.filter(
      a =>
        (risk === 'ALL' || a.risk === risk) &&
        (provider === 'ALL' || a.provider === provider) &&
        (!term ||
          `${a.org}${a.email}${a.contact}${a.id}`.toLowerCase().includes(term))
    )
  }, [category.accounts, debounced, risk, provider])

  const { pageItems, state } = usePagination(rows, 8)
  const highRisk = category.accounts.filter(a => a.risk === 'high').length

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/billing/attention"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to needs attention
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <Icon className="mt-1 size-5 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{category.label}</h1>
            <p className="text-muted-foreground text-sm">{category.detail}</p>
          </div>
          <Button
            className="ml-auto"
            onClick={() => toast.success(`${category.actionLabel} queued`)}
          >
            {category.actionLabel}
          </Button>
        </div>
      </div>

      <Carousel itemClassName="w-64" ariaLabel={`${category.label} metrics`}>
        <StatCard
          label="Accounts"
          value={String(category.count)}
          hint="flagged"
        />
        <StatCard
          label="At risk"
          value={category.atRisk}
          hint="total exposure"
        />
        <StatCard
          label={category.slaLabel}
          value={category.sla}
          hint="deadline"
        />
        <StatCard
          label="High risk"
          value={String(highRisk)}
          hint="need action first"
        />
        <StatCard
          label="Showing"
          value={`${category.accounts.length} of ${category.count}`}
          hint="sample loaded"
        />
      </Carousel>

      <Card>
        <CardContent className="text-muted-foreground p-4 text-sm">
          {category.summary}
        </CardContent>
      </Card>

      <DataTable
        variant="card"
        columns={attentionColumns}
        data={pageItems}
        rowKey={row => row.id}
        onRowClick={a =>
          router.push(`/billing/customers/${slugify(a.org)}?from=attention`)
        }
        pagination={state}
        emptyMessage="No accounts match these filters."
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search org, contact or id…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <SelectField
              className="sm:w-40"
              value={risk}
              onChange={setRisk}
              options={RISK_OPTIONS}
            />
            <SelectField
              className="sm:w-44"
              value={provider}
              onChange={setProvider}
              options={[
                { value: 'ALL', label: 'All providers' },
                ...providers.map(p => ({ value: p, label: p })),
              ]}
            />
          </div>
        }
      />
    </div>
  )
}
