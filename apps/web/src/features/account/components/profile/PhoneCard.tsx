'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Label } from '@/components/ui/form/label'
import { useProfile } from '../../hooks/useAccountQueries'
import { useUpdateProfile } from '../../hooks/useAccountMutations'
import { ChangePhoneDialog } from './ChangePhoneDialog'

export function PhoneCard() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [open, setOpen] = useState(false)

  async function savePhone(next: string | null) {
    if (!profile) return
    await updateProfile.mutateAsync({ id: profile.id, data: { phone: next } })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone number</CardTitle>
        <CardDescription>Used for account recovery and alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              readOnly
              value={profile?.phone || 'Not set'}
              className="bg-muted/40"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Update phone
          </Button>
        </div>
      </CardContent>
      <ChangePhoneDialog
        open={open}
        onOpenChange={setOpen}
        currentPhone={profile?.phone ?? null}
        onSave={savePhone}
      />
    </Card>
  )
}
