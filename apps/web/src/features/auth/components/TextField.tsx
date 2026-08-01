import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  type?: React.HTMLInputTypeAttribute
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  description?: string
  maxLength?: number
  disabled?: boolean
}

/** Reusable labelled text field wired to react-hook-form + the Form a11y layer. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
  description,
  maxLength,
  disabled,
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              autoComplete={autoComplete}
              inputMode={inputMode}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
