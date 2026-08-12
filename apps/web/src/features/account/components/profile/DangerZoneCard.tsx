'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/lib/api-client'
import {
  SudoCancelledError,
  useSudo,
} from '@/features/account/context/SudoContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProfile } from '../../hooks/useAccountQueries'
import { accountApi } from '../../api/account.api'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback

export function DangerZoneCard() {
  const { data: profile } = useProfile()
  const { accessToken, clear } = useAuth()
  const sudo = useSudo()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const confirmWord = profile?.username ?? profile?.email ?? ''
  const canDelete = confirmWord.length > 0 && confirmText.trim() === confirmWord

  async function handleExport() {
    if (!accessToken) return
    setExporting(true)
    try {
      const data = await accountApi.exportData(accessToken)
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(errText(e, 'Could not export your data.'))
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (!profile || !accessToken) return
    setDeleting(true)
    try {
      await sudo.perform(() =>
        accountApi.deleteAccount(accessToken, profile.id)
      )
      setOpen(false)
      clear()
      toast.success('Your account has been deleted.')
      router.replace('/sign-in')
    } catch (e) {
      if (e instanceof SudoCancelledError) return
      toast.error(errText(e, 'Could not delete your account.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          Export a copy of your data, or permanently delete your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-border divide-y py-0">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="font-medium">Export my data</p>
            <p className="text-muted-foreground text-sm">
              Download your profile, settings, addresses, connections, and
              recent activity as JSON.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            loading={exporting}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="font-medium">Delete account</p>
            <p className="text-muted-foreground text-sm">
              Permanently remove your account. This can&apos;t be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={() => {
              setConfirmText('')
              setOpen(true)
            }}
          >
            Delete
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={o => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account and signs you out
              everywhere. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type{' '}
              <span className="text-foreground font-medium">{confirmWord}</span>{' '}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
