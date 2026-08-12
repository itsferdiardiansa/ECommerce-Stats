'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { useProfile } from '../../hooks/useAccountQueries'
import { ChangeEmailDialog } from './ChangeEmailDialog'

export function EmailCard() {
  const { data: profile } = useProfile()
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Email address
          {profile?.emailVerifiedAt ? (
            <Badge variant="secondary">Verified</Badge>
          ) : (
            <Badge variant="outline">Unverified</Badge>
          )}
        </CardTitle>
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
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Update email
          </Button>
        </div>
      </CardContent>
      <ChangeEmailDialog open={open} onOpenChange={setOpen} />
    </Card>
  )
}
