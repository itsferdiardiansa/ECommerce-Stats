'use client'

import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { Switch } from '@/components/ui/form/switch'
import { Label } from '@/components/ui/form/label'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import { useAccountSettings } from '../../hooks/useAccountQueries'
import { useUpdateSettings } from '../../hooks/useAccountMutations'

type ToggleKey = 'alertsEmail' | 'weeklyReport' | 'marketingOptIn'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

const ROWS: { key: ToggleKey; title: string; desc: string }[] = [
  {
    key: 'alertsEmail',
    title: 'Security alerts',
    desc: 'Emails about sign-ins and changes to your security settings.',
  },
  {
    key: 'weeklyReport',
    title: 'Weekly report',
    desc: 'A weekly summary of your account activity.',
  },
  {
    key: 'marketingOptIn',
    title: 'Product updates',
    desc: 'Occasional news about new features and offers.',
  },
]

export function NotificationsForm() {
  const { data, isLoading, error } = useAccountSettings()
  const update = useUpdateSettings()

  function toggle(key: ToggleKey, value: boolean) {
    update.mutate(
      { [key]: value },
      {
        onSuccess: () => toast.success('Notification settings saved.'),
        onError: e =>
          toast.error(errText(e, 'Could not save that setting.') ?? 'Error'),
      }
    )
  }

  if (isLoading || !data) {
    return error ? (
      <FormError message={errText(error, 'Could not load your settings.')} />
    ) : (
      <Loading />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="text-muted-foreground size-4" />
          <CardTitle>Email notifications</CardTitle>
        </div>
        <CardDescription>
          Choose which emails land in your inbox. Changes save instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-border divide-y p-0">
        {ROWS.map(row => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div className="min-w-0 space-y-0.5">
              <Label htmlFor={row.key} className="font-medium">
                {row.title}
              </Label>
              <p className="text-muted-foreground text-sm">{row.desc}</p>
            </div>
            <Switch
              id={row.key}
              checked={data[row.key]}
              disabled={update.isPending}
              onCheckedChange={v => toggle(row.key, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
