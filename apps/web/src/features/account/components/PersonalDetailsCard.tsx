'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Loading } from '@/components/ui/loading'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import type { AccountSettingsUpdate } from '@/features/account/api/account.api'
import { SelectField, TextField, TextareaField } from './form-fields'
import {
  personalDetailsSchema,
  type PersonalDetailsValues,
} from '../schemas/personal-details.schema'
import { useAccountSettings } from '../hooks/useAccountQueries'
import { useUpdateSettings } from '../hooks/useAccountMutations'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export function PersonalDetailsCard() {
  const { data, isLoading, error: loadError } = useAccountSettings()
  const update = useUpdateSettings()

  const form = useForm<PersonalDetailsValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: { bio: '', birthDate: '', gender: '' },
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      bio: data.bio ?? '',
      birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '',
      gender: data.gender ?? '',
    })
  }, [data, form])

  function onSubmit(values: PersonalDetailsValues) {
    const payload: AccountSettingsUpdate = {
      bio: values.bio.trim() || null,
      birthDate: values.birthDate || null,
    }
    if (values.gender) payload.gender = values.gender
    update.mutate(payload, {
      onSuccess: () => toast.success('Personal details saved.'),
      onError: err =>
        toast.error(errText(err, 'Could not save your details.') ?? 'Error'),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal details</CardTitle>
        <CardDescription>
          A little more about you. Only you can see these.
        </CardDescription>
      </CardHeader>
      {isLoading || !data ? (
        <CardContent>
          {loadError ? (
            <FormError
              message={errText(loadError, 'Could not load your details.')}
            />
          ) : (
            <Loading />
          )}
        </CardContent>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <CardContent className="space-y-4">
              <TextareaField
                control={form.control}
                name="bio"
                label="Bio"
                maxLength={500}
                placeholder="Tell us a little about yourself"
                disabled={update.isPending}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="birthDate"
                  label="Date of birth"
                  type="date"
                  disabled={update.isPending}
                />
                <SelectField
                  control={form.control}
                  name="gender"
                  label="Gender"
                  options={GENDERS}
                  placeholder="Select"
                  disabled={update.isPending}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" loading={update.isPending}>
                Save details
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  )
}
