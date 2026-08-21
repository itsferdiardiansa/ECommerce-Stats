const CARD_RE = /visa|master|amex|jcb|card|credit|debit/i

export function estimatedArrival(method: string, currency: string): string {
  const card = CARD_RE.test(method) || currency === 'USD'
  return card ? '5 - 10 business days' : 'Within 1 business day'
}

export function nonRefundableFee(
  amount: number,
  method: string,
  currency: string
): number {
  const rate = CARD_RE.test(method) || currency === 'USD' ? 0.029 : 0.02
  return Math.round(amount * rate)
}
