'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { ApiError } from '@/lib/api-client'
import { FormError } from '@/features/auth/components/FormError'
import { AvatarUploader } from './AvatarUploader'
import { useProfile } from '../../hooks/useAccountQueries'
import { useUpdateProfile } from '../../hooks/useAccountMutations'

export function ProfileIdentityCard() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [name, setName] = useState('')

  useEffect(() => {
    if (profile) setName(profile.name ?? '')
  }, [profile])

  function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    updateProfile.mutate(
      { id: profile.id, data: { name } },
      { onSuccess: () => toast.success('Profile saved.') }
    )
  }

  async function saveAvatar(avatar: string | null) {
    if (!profile) return
    await updateProfile.mutateAsync({ id: profile.id, data: { avatar } })
    toast.success('Profile photo updated.')
  }

  const saving = updateProfile.isPending
  const error =
    updateProfile.error instanceof ApiError
      ? updateProfile.error.message
      : updateProfile.error
        ? 'Could not save your profile.'
        : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
        <CardDescription>
          This information is shown to your teammates.
        </CardDescription>
      </CardHeader>
      <form onSubmit={saveDetails} className="flex flex-col gap-6">
        <CardContent className="space-y-6">
          <FormError message={error} />
          <div className="flex items-center gap-4">
            <AvatarUploader
              value={profile?.avatar ?? null}
              name={name || profile?.email || 'User'}
              onSave={saveAvatar}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{name || '-'}</p>
              <p className="text-muted-foreground truncate text-sm">
                {profile?.email ?? ''}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile?.username ?? ''}
                readOnly
                className="text-muted-foreground cursor-not-allowed"
              />
              <p className="text-muted-foreground text-xs">
                Your username is permanent and can&apos;t be changed.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
