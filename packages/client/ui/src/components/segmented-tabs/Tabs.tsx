'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import {
  SegmentedTabs,
  type SegmentedTabOption,
  type SegmentedTabsProps,
} from './SegmentedTabs'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(component: string) {
  const ctx = useContext(TabsContext)
  if (!ctx) {
    throw new Error(`${component} must be used within <Tabs>`)
  }
  return ctx
}

export interface TabsProps {
  value?: string
  defaultValue: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal

  const ctx = useMemo<TabsContextValue>(
    () => ({
      value: active,
      setValue: next => {
        if (value === undefined) setInternal(next)
        onValueChange?.(next)
      },
    }),
    [active, value, onValueChange]
  )

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps
  extends Pick<
    SegmentedTabsProps<string>,
    'variant' | 'ariaLabel' | 'className'
  > {
  options: SegmentedTabOption<string>[]
}

function TabsList({ options, ...rest }: TabsListProps) {
  const { value, setValue } = useTabsContext('Tabs.List')
  return (
    <SegmentedTabs
      {...rest}
      value={value}
      onChange={setValue}
      options={options}
    />
  )
}

export interface TabsPanelProps {
  value: string
  children: ReactNode
  className?: string
  keepMounted?: boolean
}

function TabsPanel({
  value,
  children,
  className,
  keepMounted = false,
}: TabsPanelProps) {
  const ctx = useTabsContext('Tabs.Panel')
  const active = ctx.value === value

  if (!active && !keepMounted) return null

  return (
    <div
      role="tabpanel"
      hidden={!active}
      className={cn(!active && 'hidden', className)}
    >
      {children}
    </div>
  )
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Panel: TabsPanel,
})
