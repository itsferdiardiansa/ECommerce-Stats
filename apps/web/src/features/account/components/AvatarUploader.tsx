'use client'

import { useRef, useState } from 'react'
import { Camera, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormError } from '@/features/auth/components/FormError'

async function toAvatarDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available.')
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function AvatarUploader({
  value,
  name,
  onSave,
}: {
  value: string | null
  name: string
  onSave: (avatar: string | null) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const shown = draft !== null ? draft || null : value

  function close(next: boolean) {
    setOpen(next)
    if (!next) {
      setDraft(null)
      setError(null)
    }
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    try {
      setDraft(await toAvatarDataUrl(file))
    } catch {
      setError('Could not read that image.')
    }
  }

  async function save() {
    if (draft === null) return
    setBusy(true)
    setError(null)
    try {
      await onSave(draft === '' ? null : draft)
      close(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update your photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group focus-visible:ring-ring relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label="Change profile photo"
      >
        <Avatar className="bg-muted size-20">
          {value ? <AvatarImage src={value} alt={name} /> : null}
          <AvatarFallback className="bg-muted">
            <UserRound className="text-muted-foreground size-9" />
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-5 text-white" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile photo</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <Avatar className="bg-muted size-28">
              {shown ? <AvatarImage src={shown} alt={name} /> : null}
              <AvatarFallback className="bg-muted">
                <UserRound className="text-muted-foreground size-12" />
              </AvatarFallback>
            </Avatar>
            <FormError message={error} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pick}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                Upload from computer
              </Button>
              {shown ? (
                <Button
                  variant="ghost"
                  onClick={() => setDraft('')}
                  disabled={busy}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={save} loading={busy} disabled={draft === null}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
