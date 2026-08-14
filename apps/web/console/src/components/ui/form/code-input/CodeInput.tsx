'use client'

import { Input } from '@/components/ui/form/input'
import { digitsOnly } from '@/lib/sanitize'

type CodeInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange'
> & {
  value: string
  onValueChange: (value: string) => void
  length?: number
}

export function CodeInput({
  value,
  onValueChange,
  length = 6,
  ...props
}: CodeInputProps) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      {...props}
      maxLength={length}
      value={value}
      onChange={e => onValueChange(digitsOnly(e.target.value, length))}
    />
  )
}
