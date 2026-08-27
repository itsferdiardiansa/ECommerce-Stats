'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Button,
  Card,
  DashboardContentShell,
  DataTable,
  Input,
  SectionShell,
  SelectField,
  StatList,
  toast,
  useDebouncedValue,
  usePagination,
} from '@rufieltics/ui'
import { slugify } from '@rufieltics/core'
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
    () =>
      Array.from(new Set(category.accounts.map(account => account.provider))),
    [category.accounts]
  )

  const rows = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    return category.accounts.filter(
      account =>
        (risk === 'ALL' || account.risk === risk) &&
        (provider === 'ALL' || account.provider === provider) &&
        (!term ||
          `${account.org}${account.email}${account.contact}${account.id}`
            .toLowerCase()
            .includes(term))
    )
  }, [category.accounts, debounced, risk, provider])

  const { pageItems, state } = usePagination(rows, 8)
  const highRisk = category.accounts.filter(
    account => account.risk === 'high'
  ).length

  return (
    <DashboardContentShell
      headerComponent={
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
      }
    >
      <SectionShell>
        <StatList
          layout="carousel"
          itemClassName="w-64"
          ariaLabel={`${category.label} metrics`}
          items={[
            {
              label: 'Accounts',
              value: String(category.count),
              hint: 'flagged',
            },
            {
              label: 'At risk',
              value: category.atRisk,
              hint: 'total exposure',
            },
            { label: category.slaLabel, value: category.sla, hint: 'deadline' },
            {
              label: 'High risk',
              value: String(highRisk),
              hint: 'need action first',
            },
            {
              label: 'Showing',
              value: `${category.accounts.length} of ${category.count}`,
              hint: 'sample loaded',
            },
          ]}
        />
      </SectionShell>

      <SectionShell>
        <Card bordered={false}>
          <Card.Content className="text-muted-foreground text-sm">
            {category.summary}
          </Card.Content>
        </Card>
      </SectionShell>

      <SectionShell>
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
                onChange={event => setSearch(event.target.value)}
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
                  ...providers.map(provider => ({
                    value: provider,
                    label: provider,
                  })),
                ]}
              />
            </div>
          }
        />
      </SectionShell>
    </DashboardContentShell>
  )
}
