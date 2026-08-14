'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select'

export interface SelectFieldOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SelectFieldProps {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  options: SelectFieldOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * Options-based select that exposes a uniform `value` / `onChange(value)`
 * interface so it plugs straight into FormField, wrapping our Radix Select.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  id,
  name,
  className,
  ...aria
}: SelectFieldProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger
        id={id}
        className={className}
        aria-invalid={aria['aria-invalid']}
        aria-describedby={aria['aria-describedby']}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
