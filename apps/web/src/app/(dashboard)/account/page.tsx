'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loading } from '@/components/ui/loading'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { ApiError } from '@/lib/api-client'
import { useProfile } from '@/features/account/hooks/useAccountQueries'
import { useUpdateProfile } from '@/features/account/hooks/useAccountMutations'
import { FormError } from '@/features/auth/components/FormError'
import { AvatarUploader } from '@/features/account/components/AvatarUploader'
import { PersonalDetailsCard } from '@/features/account/components/PersonalDetailsCard'
import { ChangeEmailDialog } from '@/features/account/components/ChangeEmailDialog'
import { ChangePhoneDialog } from '@/features/account/components/ChangePhoneDialog'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { data: profile, error: loadError, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)

  useEffect(() => {
    if (!profile) return
    setName(profile.name ?? '')
    setUsername(profile.username ?? '')
    setPhone(profile.phone ?? '')
  }, [profile])

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        data: { name, username },
      })
      toast.success('Profile saved.')
    } catch {
      // surfaced via updateProfile.error
    }
  }

  async function saveAvatar(avatar: string | null) {
    if (!profile) return
    await updateProfile.mutateAsync({ id: profile.id, data: { avatar } })
    toast.success('Profile photo updated.')
  }

  async function savePhone(next: string | null) {
    if (!profile) return
    await updateProfile.mutateAsync({ id: profile.id, data: { phone: next } })
  }

  const saving = updateProfile.isPending
  const error =
    errText(loadError, 'Could not load your profile.') ??
    errText(updateProfile.error, 'Could not save your profile.')

  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '…'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account details.
        </p>
      </div>

      <FormError message={error} />

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              <CardDescription>
                This information is shown to your teammates.
              </CardDescription>
            </CardHeader>
            <form onSubmit={saveDetails} className="flex flex-col gap-6">
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <AvatarUploader
                    value={profile?.avatar ?? null}
                    name={name || profile?.email || 'User'}
                    onSave={saveAvatar}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{name || '—'}</p>
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
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      disabled={saving}
                    />
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

          <PersonalDetailsCard />

          <Card>
            <CardHeader>
              <CardTitle>Email address</CardTitle>
              <CardDescription>
                Used to sign in and for security notices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    readOnly
                    value={profile?.email ?? ''}
                    className="bg-muted/40"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailOpen(true)}
                >
                  Update email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phone number</CardTitle>
              <CardDescription>
                Used for account recovery and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    readOnly
                    value={phone || 'Not set'}
                    className="bg-muted/40"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhoneOpen(true)}
                >
                  Update phone
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Your workspace and role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {profile?.organization ? (
                <>
                  <Row label="Workspace">
                    <span className="font-medium">
                      {profile.organization.name}
                    </span>
                  </Row>
                  <Row label="Your role">
                    <Badge variant="secondary" className="capitalize">
                      {profile.organization.role.toLowerCase()}
                    </Badge>
                  </Row>
                  <Row label="Members">
                    <span className="font-medium">
                      {profile.organization.memberCount}
                    </span>
                  </Row>
                </>
              ) : (
                <p className="text-muted-foreground">
                  You are not part of an organization yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account security</CardTitle>
              <CardDescription>
                Keep your sign in protected and know where your account stands.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-border divide-y py-0">
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Two-factor authentication</p>
                  <p className="text-muted-foreground text-sm">
                    {profile?.isTwoFactorEnabled
                      ? 'On. A verification code is required when you sign in.'
                      : 'Off. Add a second step to better protect your account.'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    variant={
                      profile?.isTwoFactorEnabled ? 'secondary' : 'outline'
                    }
                  >
                    {profile
                      ? profile.isTwoFactorEnabled
                        ? 'On'
                        : 'Off'
                      : '…'}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/account/security/two-factor">Manage</Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Password</p>
                  <p className="text-muted-foreground text-sm">
                    Change the password you use to sign in.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Link href="/account/security/password">Change</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Active sessions</p>
                  <p className="text-muted-foreground text-sm">
                    Review the devices signed in to your account.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Link href="/account/sessions">View</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Member since</p>
                  <p className="text-muted-foreground text-sm">
                    The day your account was created.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium">
                  {memberSince}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ChangeEmailDialog open={emailOpen} onOpenChange={setEmailOpen} />

      <ChangePhoneDialog
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
        currentPhone={profile?.phone ?? null}
        onSave={savePhone}
      />
    </div>
  )
}
