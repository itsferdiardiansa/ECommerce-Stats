import { z } from 'zod'

export function refundSchema(paidAmount: number) {
  return z.object({
    amount: z
      .number({ error: 'Enter a valid amount' })
      .positive('Amount must be greater than 0')
      .max(paidAmount, 'Refund cannot exceed the amount paid'),
    currency: z.string().min(1),
    reason: z.string().min(1, 'Select a reason'),
    message: z.string().max(500).optional(),
  })
}

export type RefundFieldErrors = Partial<
  Record<'amount' | 'currency' | 'reason' | 'message', string>
>
