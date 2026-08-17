'use client'

import * as React from 'react'
import {
  useController,
  useFormContext,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/form/label'

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>
  label?: React.ReactNode
  description?: React.ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
  control?: Control<T>
  /** Normalize the value on every change, e.g. `v => v.replace(/\D/g, '')`. */
  transform?: (value: string) => string
  children: React.ReactElement
}

/**
 * Field wrapper that owns the label + error message via props and injects the
 * react-hook-form field wiring into its single control child (Input, SelectField, …).
 */
export function FormField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  required,
  disabled,
  className,
  control: controlProp,
  transform,
  children,
}: FormFieldProps<T>) {
  const context = useFormContext<T>()
  const { field, fieldState } = useController<T>({
    name,
    control: controlProp ?? context.control,
  })

  const error = fieldState.error?.message
  const uid = React.useId()
  const fieldId = `${uid}-field`
  const descId = description ? `${uid}-desc` : undefined
  const errorId = error ? `${uid}-error` : undefined
  const describedBy = [descId, errorId].filter(Boolean).join(' ') || undefined

  const emit = (value: string) =>
    field.onChange(transform ? transform(value) : value)

  const handleChange = (
    eventOrValue: React.ChangeEvent<HTMLInputElement> | string
  ) =>
    emit(
      typeof eventOrValue === 'string'
        ? eventOrValue
        : eventOrValue.target.value
    )

  const injected: Record<string, unknown> = {
    id: fieldId,
    name: field.name,
    value: field.value ?? '',
    onChange: handleChange,
    onBlur: field.onBlur,
    disabled: disabled ?? field.disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  }

  return (
    <div className={cn('grid gap-2', className)}>
      {label ? (
        <Label htmlFor={fieldId} className={cn(error && 'text-destructive')}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      ) : null}

      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<Record<string, unknown>>,
            injected
          )
        : children}

      {description ? (
        <p id={descId} className="text-muted-foreground text-sm">
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
