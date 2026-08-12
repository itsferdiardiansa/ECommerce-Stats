'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

export function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy to clipboard"
      className="bg-muted hover:bg-muted/70 flex w-full cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-left font-mono text-sm break-all transition-colors"
    >
      <span className="break-all">{value}</span>
      {copied ? (
        <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="text-muted-foreground size-4 shrink-0" />
      )}
    </button>
  )
}
