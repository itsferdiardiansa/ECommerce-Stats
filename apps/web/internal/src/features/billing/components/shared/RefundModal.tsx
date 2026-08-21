'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Send, X } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@rufieltics/ui'
import {
  refundSchema,
  type RefundFieldErrors,
} from '@/features/billing/schemas/refund.schema'
import type {
  RefundTarget,
  RefundValues,
} from '@/features/billing/types/refund-types'
import { RefundForm } from './RefundForm'
import { RefundReview } from './RefundReview'

const EMPTY: RefundValues = {
  mode: 'full',
  amount: null,
  currency: 'IDR',
  reason: 'requested',
  message: '',
  notify: true,
}

export function RefundModal({
  target,
  open,
  onOpenChange,
  onSubmitted,
}: {
  target: RefundTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted?: (values: RefundValues) => void
}) {
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [values, setValues] = useState<RefundValues>(EMPTY)
  const [errors, setErrors] = useState<RefundFieldErrors>({})

  useEffect(() => {
    if (open && target) {
      setStep('form')
      setErrors({})
      setValues({
        ...EMPTY,
        amount: target.paidAmount,
        currency: target.currency,
      })
    }
  }, [open, target])

  if (!target) return null

  const change = (patch: Partial<RefundValues>) =>
    setValues(prev => ({ ...prev, ...patch }))

  const over = values.amount != null && values.amount > target.paidAmount

  const propose = () => {
    const parsed = refundSchema(target.paidAmount).safeParse({
      amount: values.amount ?? undefined,
      currency: values.currency,
      reason: values.reason,
      message: values.message,
    })
    if (!parsed.success) {
      const next: RefundFieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RefundFieldErrors
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    setStep('review')
  }

  const submit = () => {
    toast.success(`Refund request submitted for ${target.customer}`)
    onSubmitted?.(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Refund' : 'Review refund'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? `Charge ${target.reference} · ${target.customer}`
              : 'Confirm the details before the request is raised.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {step === 'form' ? (
            <RefundForm
              target={target}
              values={values}
              errors={errors}
              over={over}
              onChange={change}
            />
          ) : (
            <RefundReview target={target} values={values} onChange={change} />
          )}
        </div>

        <DialogFooter>
          {step === 'form' ? (
            <>
              <DialogClose asChild>
                <Button variant="outline">
                  <X className="size-4" />
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={propose} disabled={over}>
                Propose
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('form')}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button onClick={submit}>
                <Send className="size-4" />
                Refund request
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
