import { PPN_RATE } from './refund-constants'

export function taxPortionOf(amount: number, rate: number = PPN_RATE): number {
  return Math.round((amount * rate) / (100 + rate))
}
