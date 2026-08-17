'use client'

import { useCallback } from 'react'

interface PreventableEvent {
  preventDefault: () => void
}

/**
 * Blocks a Dialog/Sheet from being dismissed while `active` (a write is in
 * flight): closing, Escape, and outside clicks are ignored. Spread
 * `dismissProps` on the Dialog/Sheet content, wrap the setter with `guard`, and
 * pass `hideClose` to hide the ✕. Reads don't use this - they abort on close.
 */
export function useDismissGuard(active: boolean) {
  const guard = useCallback(
    (setOpen: (open: boolean) => void) => (open: boolean) => {
      if (active && !open) return
      setOpen(open)
    },
    [active]
  )

  const dismissProps = active
    ? {
        onEscapeKeyDown: (e: PreventableEvent) => e.preventDefault(),
        onPointerDownOutside: (e: PreventableEvent) => e.preventDefault(),
        onInteractOutside: (e: PreventableEvent) => e.preventDefault(),
      }
    : {}

  return { guard, dismissProps, hideClose: active }
}
