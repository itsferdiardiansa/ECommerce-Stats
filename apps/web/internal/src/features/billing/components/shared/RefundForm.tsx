'use client'

import { useState } from 'react'
import { TriangleAlert, Wallet } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  MaskedInput,
  SelectField,
  cn,
} from '@rufieltics/ui'
import { formatCurrency, percentOf } from '@rufieltics/core-client'
import {
  REFUND_CURRENCIES,
  REFUND_QUICK_PERCENTS,
  REFUND_REASONS,
} from '@/features/billing/lib/refund/refund-constants'
import type { RefundFieldErrors } from '@/features/billing/schemas/refund.schema'
import type {
  RefundMode,
  RefundTarget,
  RefundValues,
} from '@/features/billing/types/refund-types'

const PARTIAL_MODES: { value: RefundMode; label: string }[] = [
  { value: 'percent', label: 'Percentage' },
  { value: 'custom-percent', label: 'Custom %' },
  { value: 'custom', label: 'Custom amount' },
]

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="bg-muted inline-flex w-full rounded-md p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-[5px] px-2 py-1 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function RefundForm({
  target,
  values,
  errors,
  over,
  onChange,
}: {
  target: RefundTarget
  values: RefundValues
  errors: RefundFieldErrors
  over: boolean
  onChange: (patch: Partial<RefundValues>) => void
}) {
  const pct = percentOf(values.amount, target.paidAmount)
  const [percentText, setPercentText] = useState(String(pct))

  const roundAmount = (raw: number) =>
    values.currency === 'IDR' ? Math.round(raw) : Math.round(raw * 100) / 100

  const applyPercent = (percent: number) =>
    onChange({ amount: roundAmount((target.paidAmount * percent) / 100) })

  const setMode = (mode: RefundMode) => {
    if (mode === 'full') {
      onChange({ mode, amount: target.paidAmount })
      setPercentText('100')
      return
    }
    onChange({ mode })
  }

  const onPercentText = (text: string) => {
    setPercentText(text)
    const n = Number(text)
    if (!Number.isNaN(n) && n >= 0) applyPercent(Math.min(n, 100))
  }

  const amountEditable = values.mode === 'custom'

  return (
    <>
      <div className="space-y-2">
        <label className="text-xs font-medium">Refund amount</label>
        <Segmented
          value={values.mode === 'full' ? 'full' : 'partial'}
          options={[
            { value: 'full', label: 'Full refund' },
            { value: 'partial', label: 'Partial' },
          ]}
          onChange={choice => setMode(choice === 'full' ? 'full' : 'percent')}
        />

        {values.mode !== 'full' ? (
          <Segmented
            value={values.mode}
            options={PARTIAL_MODES}
            onChange={setMode}
          />
        ) : null}
      </div>

      {values.mode === 'percent' ? (
        <div className="flex flex-wrap items-center gap-2">
          {REFUND_QUICK_PERCENTS.map(q => (
            <Button
              key={q}
              type="button"
              variant={pct === q ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPercent(q)}
            >
              {q}%
            </Button>
          ))}
        </div>
      ) : null}

      {values.mode === 'custom-percent' ? (
        <div className="flex items-center gap-2">
          <div className="relative w-28">
            <Input
              inputMode="decimal"
              value={percentText}
              onChange={e => onPercentText(e.target.value)}
              className="pr-7"
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
              %
            </span>
          </div>
          <span className="text-muted-foreground text-xs">of the charge</span>
        </div>
      ) : null}

      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Currency</label>
          <SelectField
            value={values.currency}
            onChange={currency => onChange({ currency })}
            options={REFUND_CURRENCIES}
            disabled={!amountEditable}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Amount</label>
          <MaskedInput
            currency={values.currency}
            value={values.amount}
            onValueChange={amount => onChange({ amount })}
            hasError={!!errors.amount || over}
            readOnly={!amountEditable}
            className={
              amountEditable ? undefined : 'bg-muted/40 text-muted-foreground'
            }
          />
        </div>
      </div>

      {errors.amount ? (
        <p className="text-destructive text-xs">{errors.amount}</p>
      ) : null}

      {over ? (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertDescription>
            Refund exceeds the original charge of{' '}
            {formatCurrency(target.paidAmount, target.currency)}.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
          <Wallet className="size-3.5" />
          <span>
            {pct}% of {formatCurrency(target.paidAmount, target.currency)}
          </span>
          <span className="ml-auto">
            Available balance:{' '}
            <span className="text-foreground font-medium">
              {formatCurrency(target.balance, target.currency)}
            </span>
          </span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium">Reason</label>
        <SelectField
          value={values.reason}
          onChange={reason => onChange({ reason })}
          options={REFUND_REASONS}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Message to customer{' '}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={values.message}
          onChange={e => onChange({ message: e.target.value })}
          placeholder="Added to the refund email / ticket reply."
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </>
  )
}
