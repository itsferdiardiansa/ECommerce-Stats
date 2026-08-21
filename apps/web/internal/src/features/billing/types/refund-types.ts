export interface RefundMethod {
  label: string
  account?: string
  color: string
}

export interface RefundTarget {
  reference: string
  customer: string
  customerEmail: string
  paidAmount: number
  currency: string
  method: RefundMethod
  plan?: { name: string; price: string; interval?: string }
  balance: number
}

export type RefundMode = 'full' | 'percent' | 'custom-percent' | 'custom'

export interface RefundValues {
  mode: RefundMode
  amount: number | null
  currency: string
  reason: string
  message: string
  notify: boolean
}
