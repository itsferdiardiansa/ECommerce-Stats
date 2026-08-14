'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context'
import { isSilentError } from '@/lib/errors'
import { useAbortSignal } from '@/hooks/useAbortSignal'
import { staffApi, type RoleRow, type StaffRow } from '../api'

export function useStaff() {
  const { token } = useAuth()
  const nextSignal = useAbortSignal()
  const [rows, setRows] = useState<StaffRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!token) return
    const signal = nextSignal()
    setLoading(true)
    setError('')
    try {
      const [list, roleList] = await Promise.all([
        staffApi.list(token, signal),
        staffApi.roles(token, signal),
      ])
      setRows(list)
      setRoles(roleList)
    } catch (e) {
      if (isSilentError(e)) return
      setError(e instanceof Error ? e.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [token, nextSignal])

  useEffect(() => {
    void reload()
  }, [reload])

  return { token, rows, roles, loading, error, reload }
}

export function sortSuperFirst(rows: StaffRow[]): StaffRow[] {
  return [...rows].sort(
    (a, b) => Number(b.isSuperAdmin) - Number(a.isSuperAdmin)
  )
}
