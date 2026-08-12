'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProfile } from '../../hooks/useAccountQueries'

export function SecurityOverviewCard() {
  const { data: profile } = useProfile()

  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '…'

  return (
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
              variant={profile?.isTwoFactorEnabled ? 'secondary' : 'outline'}
            >
              {profile ? (profile.isTwoFactorEnabled ? 'On' : 'Off') : '…'}
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
          <Button asChild variant="outline" size="sm" className="shrink-0">
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
          <Button asChild variant="outline" size="sm" className="shrink-0">
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
          <span className="shrink-0 text-sm font-medium">{memberSince}</span>
        </div>
      </CardContent>
    </Card>
  )
}
