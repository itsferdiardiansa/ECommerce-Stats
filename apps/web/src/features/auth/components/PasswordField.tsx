'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'

interface PasswordFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  autoComplete?: 'current-password' | 'new-password'
}

/** Reusable password field with an accessible show/hide toggle. */
export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  autoComplete = 'current-password',
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                type={visible ? 'text' : 'password'}
                autoComplete={autoComplete}
                className="pr-10"
                {...field}
              />
            </FormControl>
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 outline-none focus-visible:ring-[3px]"
            >
              {visible ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
