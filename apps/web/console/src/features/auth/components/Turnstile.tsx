'use client'

import { useEffect, useRef } from 'react'
import { env } from '@/config/env'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback: (token: string) => void
      'error-callback'?: () => void
      'expired-callback'?: () => void
    }
  ) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export function Turnstile({
  onToken,
  onError,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void
  onError?: () => void
  resetKey?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onError)
  onTokenRef.current = onToken
  onErrorRef.current = onError

  useEffect(() => {
    if (!env.captcha.enabled) return
    let cancelled = false

    function render() {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) {
        return
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: env.captcha.turnstileSiteKey,
        callback: token => onTokenRef.current(token),
        'error-callback': () => {
          onTokenRef.current(null)
          onErrorRef.current?.()
        },
        'expired-callback': () => onTokenRef.current(null),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`
      )
      if (existing) {
        existing.addEventListener('load', render)
        existing.addEventListener('error', () => onErrorRef.current?.())
      } else {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = render
        script.onerror = () => onErrorRef.current?.()
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (env.captcha.enabled && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current)
      onTokenRef.current(null)
    }
  }, [resetKey])

  if (!env.captcha.enabled) return null
  return (
    <div ref={ref} className="flex min-h-[65px] items-center justify-center" />
  )
}
