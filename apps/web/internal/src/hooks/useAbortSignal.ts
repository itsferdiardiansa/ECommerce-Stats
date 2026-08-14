'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a stable factory that yields a fresh AbortSignal per call (cancelling
 * the previous one) and aborts the in-flight request when the component
 * unmounts - e.g. the user changes page or closes the modal mid-request.
 */
export function useAbortSignal() {
  const ref = useRef<AbortController | null>(null)

  useEffect(() => () => ref.current?.abort(), [])

  return useCallback(() => {
    ref.current?.abort()
    ref.current = new AbortController()
    return ref.current.signal
  }, [])
}
