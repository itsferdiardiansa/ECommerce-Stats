'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ConsoleBreadcrumb } from './ConsoleBreadcrumb'
import type { BreadcrumbCrumb } from '@/features/console/lib/nav'

interface BreadcrumbScopeValue {
  extra: BreadcrumbCrumb[]
  setExtra: (crumbs: BreadcrumbCrumb[]) => void
}

const BreadcrumbScopeContext = createContext<BreadcrumbScopeValue | null>(null)

export function BreadcrumbScope({ children }: { children: ReactNode }) {
  const [extra, setExtra] = useState<BreadcrumbCrumb[]>([])
  return (
    <BreadcrumbScopeContext.Provider value={{ extra, setExtra }}>
      {children}
    </BreadcrumbScopeContext.Provider>
  )
}

export function ScopedBreadcrumb({ base }: { base: BreadcrumbCrumb[] }) {
  const ctx = useContext(BreadcrumbScopeContext)
  const extra = ctx?.extra ?? []
  return <ConsoleBreadcrumb items={[...base, ...extra]} />
}

export function useBreadcrumbLeaf(label: string, href?: string) {
  const ctx = useContext(BreadcrumbScopeContext)
  const setExtra = ctx?.setExtra

  useEffect(() => {
    if (!setExtra || !label) return
    setExtra([{ label, href }])
    return () => setExtra([])
  }, [setExtra, label, href])
}
