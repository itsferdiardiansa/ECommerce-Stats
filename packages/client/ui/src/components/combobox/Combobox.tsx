'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/popover'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  /** Keep the popover open after a selection (multi-add flows). */
  keepOpenOnSelect?: boolean
  /**
   * Promote the popover to its own top layer. Only needed when the Combobox
   * lives inside a modal Dialog/Sheet *and* no `container` is supplied.
   */
  modal?: boolean
  /**
   * Portal target for the popover. Inside a modal Dialog/Sheet, pass the
   * dialog/sheet element so the list stays within its focus + pointer-events
   * scope (otherwise the search field and options are not clickable).
   */
  container?: HTMLElement | null
}

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  disabled,
  className,
  keepOpenOnSelect,
  modal,
  container,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      option =>
        option.label.toLowerCase().includes(q) ||
        option.value.toLowerCase().includes(q) ||
        option.description?.toLowerCase().includes(q)
    )
  }, [options, query])

  const selectedLabel = options.find(option => option.value === value)?.label

  const handleSelect = (next: string) => {
    onSelect(next)
    setQuery('')
    if (!keepOpenOnSelect) setOpen(false)
  }

  return (
    <Popover
      modal={modal ?? !container}
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          'border-input bg-transparent hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          !selectedLabel && 'text-muted-foreground',
          className
        )}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        container={container}
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="placeholder:text-muted-foreground h-9 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              {emptyText}
            </p>
          ) : (
            filtered.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="hover:bg-accent hover:text-accent-foreground flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none"
              >
                <Check
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    option.value === value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.description ? (
                    <span className="text-muted-foreground block truncate text-xs">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
