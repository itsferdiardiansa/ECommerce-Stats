import * as React from 'react'
import { cn } from '@/lib/utils'
import { PAYMENT_LOGOS } from '@/assets/payments/logos'

export type PaymentKey =
  | 'dana'
  | 'gopay'
  | 'mastercard'
  | 'midtrans'
  | 'ovo'
  | 'qris'
  | 'stripe'
  | 'visa'
  | 'xendit'

const ALIASES: [RegExp, PaymentKey][] = [
  [/gopay/i, 'gopay'],
  [/ovo/i, 'ovo'],
  [/dana/i, 'dana'],
  [/qris/i, 'qris'],
  [/visa/i, 'visa'],
  [/master/i, 'mastercard'],
  [/midtrans/i, 'midtrans'],
  [/stripe/i, 'stripe'],
  [/xendit/i, 'xendit'],
]

export function resolvePaymentKey(value: string): PaymentKey | null {
  for (const [pattern, key] of ALIASES) {
    if (pattern.test(value)) return key
  }
  return null
}

export interface PaymentLogoProps {
  /** A method or provider name, e.g. "Visa •4242", "GoPay", "Stripe". */
  name: string
  className?: string
  alt?: string
}

export function PaymentLogo({ name, className, alt }: PaymentLogoProps) {
  const key = resolvePaymentKey(name)
  if (!key) return null

  return (
    <img
      src={PAYMENT_LOGOS[key]}
      alt={alt ?? name}
      className={cn('inline-block h-4 w-auto object-contain', className)}
    />
  )
}
