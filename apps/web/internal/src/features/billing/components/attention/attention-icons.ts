import {
  AlertTriangle,
  CreditCard,
  Gavel,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import type { AttentionKey } from '@/features/billing/data/attention'

export const ATTENTION_ICON: Record<AttentionKey, LucideIcon> = {
  'past-due': CreditCard,
  failed: AlertTriangle,
  disputes: Gavel,
  trials: Timer,
}
