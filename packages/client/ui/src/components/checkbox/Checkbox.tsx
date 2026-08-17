import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'type'> {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({
  className,
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <span className="relative inline-flex size-4 shrink-0">
      <input
        type="checkbox"
        data-slot="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onCheckedChange?.(e.target.checked)}
        className={cn(
          'peer size-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border shadow-xs transition-[color,box-shadow] outline-none',
          'border-input bg-transparent',
          'checked:border-primary checked:bg-primary',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          indeterminate && 'border-primary bg-primary',
          className
        )}
        {...props}
      />
      {indeterminate ? (
        <Minus className="text-primary-foreground pointer-events-none absolute inset-0 size-4 p-[1px]" />
      ) : (
        <Check className="text-primary-foreground pointer-events-none absolute inset-0 size-4 scale-0 p-[1px] transition-transform peer-checked:scale-100" />
      )}
    </span>
  )
}

export { Checkbox }
