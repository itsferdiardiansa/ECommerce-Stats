'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CalendarClock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Loading } from '@/components/ui/loading'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import { SelectField } from '../form-fields'
import {
  preferencesSchema,
  type PreferencesValues,
} from '../../schemas/preferences.schema'
import { useAccountSettings } from '../../hooks/useAccountQueries'
import { useUpdateSettings } from '../../hooks/useAccountMutations'
import type { AccountSettings } from '../../api/account.api'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
]
const CURRENCIES = ['USD', 'EUR', 'GBP', 'IDR', 'SGD'].map(c => ({
  value: c,
  label: c,
}))
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (08/12/2026)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (12/08/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-08-12)' },
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY (Aug 12, 2026)' },
  { value: 'MMMM D, YYYY', label: 'MMMM D, YYYY (August 12, 2026)' },
  { value: 'D MMM YYYY', label: 'D MMM YYYY (12 Aug 2026)' },
]
const WEEK_START = ['Sunday', 'Monday'].map(w => ({ value: w, label: w }))
const TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const DEFAULTS: PreferencesValues = {
  languagePref: 'en',
  currencyPref: 'USD',
  defaultTimezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  weekStartsOn: 'Monday',
}

function orDefault<K extends keyof PreferencesValues>(
  value: string | undefined,
  allowed: readonly string[],
  key: K
): PreferencesValues[K] {
  return (
    value && allowed.includes(value) ? value : DEFAULTS[key]
  ) as PreferencesValues[K]
}

export function PreferencesForm() {
  const { data, isLoading, error: loadError } = useAccountSettings()

  if (!data) {
    return loadError && !isLoading ? (
      <FormError
        message={errText(loadError, 'Could not load your settings.')}
      />
    ) : (
      <Loading />
    )
  }

  return <PreferencesFormInner settings={data} />
}

function PreferencesFormInner({ settings }: { settings: AccountSettings }) {
  const update = useUpdateSettings()

  const form = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      languagePref: orDefault(
        settings.languagePref,
        LANGUAGES.map(l => l.value),
        'languagePref'
      ),
      currencyPref: orDefault(
        settings.currencyPref,
        CURRENCIES.map(c => c.value),
        'currencyPref'
      ),
      defaultTimezone: settings.defaultTimezone || DEFAULTS.defaultTimezone,
      dateFormat: orDefault(
        settings.dateFormat,
        DATE_FORMATS.map(d => d.value),
        'dateFormat'
      ),
      weekStartsOn: orDefault(
        settings.weekStartsOn,
        WEEK_START.map(w => w.value),
        'weekStartsOn'
      ),
    },
  })

  function onSubmit(values: PreferencesValues) {
    update.mutate(values, {
      onSuccess: () => toast.success('Preferences saved.'),
      onError: err =>
        toast.error(
          errText(err, 'Could not save your preferences.') ?? 'Error'
        ),
    })
  }

  const zoneOptions = TIMEZONES.includes(settings.defaultTimezone)
    ? TIMEZONES
    : [settings.defaultTimezone, ...TIMEZONES]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground size-4" />
              <CardTitle>Localization</CardTitle>
            </div>
            <CardDescription>
              How language and money are shown to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SelectField
              control={form.control}
              name="languagePref"
              label="Language"
              options={LANGUAGES}
              disabled={update.isPending}
              description="The interface language. Translation is coming soon - your choice is saved for then."
            />
            <SelectField
              control={form.control}
              name="currencyPref"
              label="Currency"
              options={CURRENCIES}
              disabled={update.isPending}
              description="Prices and order totals are displayed in this currency."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock className="text-muted-foreground size-4" />
              <CardTitle>Date &amp; time</CardTitle>
            </div>
            <CardDescription>
              How dates and times appear across the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SelectField
              control={form.control}
              name="defaultTimezone"
              label="Time zone"
              options={zoneOptions.map(z => ({
                value: z,
                label: z.replace(/_/g, ' '),
              }))}
              contentClassName="max-h-72"
              disabled={update.isPending}
              description="Timestamps like sign-ins and orders are shown in this zone."
            />
            <SelectField
              control={form.control}
              name="dateFormat"
              label="Date format"
              options={DATE_FORMATS}
              disabled={update.isPending}
              description="The pattern used when a date is shown as numbers."
            />
            <SelectField
              control={form.control}
              name="weekStartsOn"
              label="Week starts on"
              options={WEEK_START}
              disabled={update.isPending}
              description="The first day of the week in calendars and reports."
            />
          </CardContent>
        </Card>

        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
      </form>
    </Form>
  )
}
