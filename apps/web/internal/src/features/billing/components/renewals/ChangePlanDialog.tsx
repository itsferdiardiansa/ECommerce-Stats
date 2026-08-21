'use client'

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SelectField,
  toast,
} from '@rufieltics/ui'
import type { Renewal } from '@/features/billing/data/renewals'

const PLAN_OPTIONS = [
  { value: 'Starter', label: 'Starter · Rp 149.000/mo' },
  { value: 'Growth', label: 'Growth · Rp 499.000/mo' },
  { value: 'Scale', label: 'Scale · Rp 1.299.000/mo' },
  { value: 'Scale (annual)', label: 'Scale annual · Rp 12.990.000/yr' },
]

const currentPlanKey = (plan: string) =>
  PLAN_OPTIONS.find(p => plan.startsWith(p.value.split(' ')[0]))?.value ??
  'Growth'

export function ChangePlanDialog({
  renewal,
  open,
  onOpenChange,
}: {
  renewal: Renewal
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [plan, setPlan] = useState(currentPlanKey(renewal.plan))

  useEffect(() => {
    if (open) setPlan(currentPlanKey(renewal.plan))
  }, [open, renewal.plan])

  const changed = plan !== currentPlanKey(renewal.plan)

  const submit = () => {
    toast.success(`${renewal.org} moved to ${plan} · customer notified`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            {renewal.org} · currently on {renewal.plan}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">New plan</label>
            <SelectField
              value={plan}
              onChange={setPlan}
              options={PLAN_OPTIONS}
            />
          </div>

          <Alert variant="info">
            <Info className="size-4" />
            <AlertDescription>
              <p>
                The customer will be notified by email at{' '}
                <span className="font-semibold">{renewal.email}</span> and the
                new price applies from the next renewal on{' '}
                <span className="font-semibold">{renewal.nextCharge}</span>. A
                prorated adjustment may apply.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!changed}>
            Change plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
