'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { startRegistration } from '@simplewebauthn/browser'
import { Check, Fingerprint, Pencil, Smartphone, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form/input'
import { Loading } from '@/components/ui/loading'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/lib/api-client'
import { mfaApi } from '@/features/auth/api/mfa.api'
import { useAuth } from '@/features/auth/context/AuthContext'
import {
  SudoCancelledError,
  useSudo,
} from '@/features/account/context/SudoContext'
import { FormError } from '@/features/auth/components/FormError'
import {
  passkeyIcon,
  passkeyProviderName,
} from '@/features/account/lib/passkey-provider'
import { relativeTime } from '@/lib/relative-time'
import type { PasskeySummary } from '@/features/auth/types'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

function passkeyCreateError(
  e: unknown,
  attachment: 'platform' | 'cross-platform'
): string {
  if (e instanceof ApiError) return e.message
  const name = e instanceof Error ? e.name : ''
  if (name === 'InvalidStateError') {
    return 'This device already has a passkey for your account. Remove it first, or use another device.'
  }
  if (name === 'NotAllowedError') {
    return attachment === 'platform'
      ? 'Could not create a passkey here. This device may already have one for your account — remove it first, or use another device.'
      : 'Passkey creation was cancelled or timed out. Please try again.'
  }
  return 'Passkey creation was unavailable. Please try again.'
}

const PASSKEYS_KEY = ['account', 'passkeys'] as const

export function PasskeysManager() {
  const { accessToken } = useAuth()
  const sudo = useSudo()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removePending, setRemovePending] = useState(false)

  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: PASSKEYS_KEY,
    queryFn: () => mfaApi.listPasskeys(accessToken as string),
    enabled: !!accessToken,
  })
  const passkeys = data?.passkeys

  const rename = useMutation({
    mutationFn: (vars: { id: string; name: string }) =>
      mfaApi.renamePasskey(accessToken as string, vars.id, vars.name),
  })

  async function openCreate() {
    setError(null)
    setPreparing(true)
    try {
      await sudo.perform(() => Promise.resolve())
      setCreateOpen(true)
    } catch (e) {
      if (e instanceof SudoCancelledError) return
      setError(errText(e, 'Could not verify your identity.'))
    } finally {
      setPreparing(false)
    }
  }

  async function create(attachment: 'platform' | 'cross-platform') {
    setError(null)
    setCreateOpen(false)
    setCreating(true)
    try {
      const options = await mfaApi.passkeyRegisterOptions(
        accessToken as string,
        attachment
      )
      const response = await startRegistration({ optionsJSON: options })
      await mfaApi.passkeyRegisterVerify(accessToken as string, response)
      await qc.invalidateQueries({ queryKey: PASSKEYS_KEY })
      toast.success('Passkey created.')
    } catch (e) {
      setError(passkeyCreateError(e, attachment))
    } finally {
      setCreating(false)
    }
  }

  async function confirmRemove(id: string) {
    setError(null)
    setRemovePending(true)
    try {
      await sudo.perform(() => mfaApi.deletePasskey(accessToken as string, id))
      setRemovingId(null)
      await qc.invalidateQueries({ queryKey: PASSKEYS_KEY })
      toast.success('Passkey removed.')
    } catch (e) {
      setRemovingId(null)
      if (e instanceof SudoCancelledError) return
      setError(errText(e, 'Could not remove the passkey.'))
    } finally {
      setRemovePending(false)
    }
  }

  function startRename(pk: PasskeySummary) {
    setRenamingId(pk.id)
    setRenameValue(pk.name ?? passkeyProviderName(pk))
  }

  async function submitRename(id: string) {
    const name = renameValue.trim()
    if (!name) {
      setRenamingId(null)
      return
    }
    setError(null)
    try {
      await sudo.perform(() => rename.mutateAsync({ id, name }))
      setRenamingId(null)
      await qc.invalidateQueries({ queryKey: PASSKEYS_KEY })
      toast.success('Passkey renamed.')
    } catch (e) {
      if (e instanceof SudoCancelledError) return
      setError(errText(e, 'Could not rename the passkey.'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Passkeys let you sign in with your fingerprint, face, screen lock, or
          a security key.
        </p>
        <Button
          type="button"
          className="shrink-0"
          onClick={openCreate}
          loading={preparing || creating}
        >
          Create passkey
        </Button>
      </div>

      <FormError
        message={error ?? errText(loadError, 'Could not load your passkeys.')}
      />

      {isLoading ? (
        <Loading />
      ) : passkeys && passkeys.length > 0 ? (
        <ul className="divide-border divide-y rounded-md border">
          {passkeys.map(pk => {
            const Icon = passkeyIcon(pk)
            return (
              <li
                key={pk.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0">
                    {renamingId === pk.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') void submitRename(pk.id)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void submitRename(pk.id)}
                          aria-label="Save name"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setRenamingId(null)}
                          aria-label="Cancel"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="truncate text-sm font-medium">
                        {pk.name ?? passkeyProviderName(pk)}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Created {relativeTime(pk.createdAt)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Last used{' '}
                      {pk.lastUsedAt
                        ? relativeTime(pk.lastUsedAt) +
                          (pk.lastUsedDevice ? `, ${pk.lastUsedDevice}` : '')
                        : 'not yet used'}
                    </p>
                  </div>
                </div>

                {renamingId === pk.id ? null : (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startRename(pk)}
                      aria-label={`Rename ${pk.name ?? passkeyProviderName(pk)}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemovingId(pk.id)}
                      aria-label={`Remove ${pk.name ?? passkeyProviderName(pk)}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-md border p-4 text-sm">
          You have no passkeys yet.
        </p>
      )}

      <Dialog
        open={!!removingId}
        onOpenChange={next => {
          if (!next && !removePending) setRemovingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove passkey?</DialogTitle>
            <DialogDescription>
              You will no longer be able to sign in with this passkey.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRemovingId(null)}
              disabled={removePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={removePending}
              onClick={() => removingId && void confirmRemove(removingId)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a passkey</DialogTitle>
            <DialogDescription>
              Where would you like to save this passkey?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void create('platform')}
              className="hover:bg-accent focus-visible:ring-ring flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Fingerprint className="size-6" />
              <span className="text-sm font-medium">Create on this device</span>
              <span className="text-muted-foreground text-xs">
                Use Touch ID, Windows Hello, or your device unlock.
              </span>
            </button>
            <button
              type="button"
              onClick={() => void create('cross-platform')}
              className="hover:bg-accent focus-visible:ring-ring flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Smartphone className="size-6" />
              <span className="text-sm font-medium">Use another device</span>
              <span className="text-muted-foreground text-xs">
                Scan a QR code with your phone, or use a security key.
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
