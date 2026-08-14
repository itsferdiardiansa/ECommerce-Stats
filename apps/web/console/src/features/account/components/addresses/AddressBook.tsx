'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { MapPin, Pencil, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Form } from '@/components/ui/form'
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
import { FormError } from '@/features/auth/components/FormError'
import type { Address, AddressInput } from '@/features/account/api/account.api'
import { SelectField, SwitchField, TextField } from '../form-fields'
import { addressSchema, type AddressValues } from '../../schemas/address.schema'
import { useAddresses } from '../../hooks/useAccountQueries'
import {
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '../../hooks/useAccountMutations'

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e ? fallback : null

const EMPTY: AddressValues = {
  label: '',
  type: 'shipping',
  street1: '',
  street2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
}

const TYPES = [
  { value: 'shipping', label: 'Shipping' },
  { value: 'billing', label: 'Billing' },
]

export function AddressBook() {
  const { data, isLoading, error: loadError } = useAddresses()
  const create = useCreateAddress()
  const update = useUpdateAddress()
  const remove = useDeleteAddress()
  const setDefault = useSetDefaultAddress()

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
  })

  const saving = create.isPending || update.isPending

  function openNew() {
    setEditingId(null)
    setFormError(null)
    form.reset(EMPTY)
    setOpen(true)
  }

  function openEdit(a: Address) {
    setEditingId(a.id)
    setFormError(null)
    form.reset({
      label: a.label ?? '',
      type: a.type === 'billing' ? 'billing' : 'shipping',
      street1: a.street1,
      street2: a.street2 ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone ?? '',
      isDefault: a.isDefault,
    })
    setOpen(true)
  }

  function onSubmit(values: AddressValues) {
    setFormError(null)
    const payload: AddressInput = {
      ...values,
      label: values.label.trim() || null,
      street2: values.street2.trim() || null,
      phone: values.phone.trim() || null,
    }
    const onError = (err: unknown) =>
      setFormError(errText(err, 'Could not save the address.'))
    if (editingId == null) {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success('Address added.')
          setOpen(false)
        },
        onError,
      })
    } else {
      update.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success('Address updated.')
            setOpen(false)
          },
          onError,
        }
      )
    }
  }

  function makeDefault(id: number) {
    setDefault.mutate(id, {
      onSuccess: () => toast.success('Default address updated.'),
      onError: e =>
        toast.error(errText(e, 'Could not update the default.') ?? 'Error'),
    })
  }

  function confirmRemove(id: number) {
    remove.mutate(id, {
      onSuccess: () => {
        toast.success('Address removed.')
        setRemovingId(null)
      },
      onError: e =>
        toast.error(errText(e, 'Could not remove the address.') ?? 'Error'),
    })
  }

  if (isLoading || data === undefined) {
    return loadError ? (
      <FormError
        message={errText(loadError, 'Could not load your addresses.')}
      />
    ) : (
      <Loading />
    )
  }

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You haven&apos;t added any addresses yet.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map(a => (
            <Card key={a.id} className="py-0">
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 gap-3">
                  <MapPin className="text-muted-foreground mt-0.5 size-5 shrink-0" />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {a.label || a.street1}
                      </span>
                      {a.isDefault ? (
                        <Badge variant="secondary">Default</Badge>
                      ) : null}
                      <Badge variant="outline" className="capitalize">
                        {a.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate text-sm">
                      {[
                        a.street1,
                        a.street2,
                        a.city,
                        a.state,
                        a.postalCode,
                        a.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {a.phone ? (
                      <p className="text-muted-foreground text-sm">{a.phone}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!a.isDefault ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Set as default"
                      onClick={() => makeDefault(a.id)}
                      disabled={setDefault.isPending}
                    >
                      <Star className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit address"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove address"
                    onClick={() => setRemovingId(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={openNew}>
        Add address
      </Button>

      <Dialog
        open={open}
        onOpenChange={next => {
          if (!saving) setOpen(next)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId == null ? 'Add address' : 'Edit address'}
            </DialogTitle>
            <DialogDescription>
              Used for shipping and billing on your orders.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="label"
                  label="Label"
                  placeholder="Home, Office…"
                  disabled={saving}
                />
                <SelectField
                  control={form.control}
                  name="type"
                  label="Type"
                  options={TYPES}
                  disabled={saving}
                />
              </div>
              <TextField
                control={form.control}
                name="street1"
                label="Street address"
                disabled={saving}
              />
              <TextField
                control={form.control}
                name="street2"
                label="Apartment, suite, etc. (optional)"
                disabled={saving}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="city"
                  label="City"
                  disabled={saving}
                />
                <TextField
                  control={form.control}
                  name="state"
                  label="State / Province"
                  disabled={saving}
                />
                <TextField
                  control={form.control}
                  name="postalCode"
                  label="Postal code"
                  disabled={saving}
                />
                <TextField
                  control={form.control}
                  name="country"
                  label="Country"
                  disabled={saving}
                />
              </div>
              <TextField
                control={form.control}
                name="phone"
                label="Phone (optional)"
                disabled={saving}
              />
              <SwitchField
                control={form.control}
                name="isDefault"
                label="Set as default address"
                disabled={saving}
              />
              <FormError message={formError} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingId == null ? 'Add address' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removingId !== null}
        onOpenChange={next => {
          if (!remove.isPending && !next) setRemovingId(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove address?</DialogTitle>
            <DialogDescription>
              This address will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRemovingId(null)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removingId !== null && confirmRemove(removingId)}
              loading={remove.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
