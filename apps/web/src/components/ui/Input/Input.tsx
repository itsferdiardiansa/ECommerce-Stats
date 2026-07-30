import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground md:text-sm border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      inputSize: {
        default: 'h-9 px-3 py-1',
        sm: 'h-8 px-2.5 py-1 text-sm',
        lg: 'h-10 px-4 py-2',
      },
    },
    defaultVariants: {
      inputSize: 'default',
    },
  }
)

export type InputProps = React.ComponentProps<'input'> &
  VariantProps<typeof inputVariants>

function Input({ className, inputSize, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ inputSize, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
