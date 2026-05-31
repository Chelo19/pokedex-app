import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { TcgSet } from '../types/tcg'

const LOCAL_KEY = 'tcg-catalog-sets-v1'

type CatalogRow = {
  set_id: string
  name: string
  series: string
  release_date: string
  total: number
  logo_url: string | null
  sort_order: number
}

function rowToSet(row: CatalogRow): TcgSet {
  return {
    id: row.set_id,
    name: row.name,
    series: row.series,
    releaseDate: row.release_date,
    total: row.total,
    logoUrl: row.logo_url ?? undefined,
  }
}

function setToRow(set: TcgSet, sortOrder: number): CatalogRow {
  return {
    set_id: set.id,
    name: set.name,
    series: set.series,
    release_date: set.releaseDate,
    total: set.total,
    logo_url: set.logoUrl ?? null,
    sort_order: sortOrder,
  }
}

function loadLocal(): TcgSet[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TcgSet[]
  } catch {
    return []
  }
}

function saveLocal(sets: TcgSet[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(sets))
}

export function useTcgCatalog() {
  const [sets, setSets] = useState<TcgSet[]>([])
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setSyncError(null)

    if (supabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tcg_catalog_sets')
        .select('set_id, name, series, release_date, total, logo_url, sort_order')
        .order('sort_order', { ascending: true })
        .order('release_date', { ascending: false })

      if (error) {
        setSyncError(error.message)
        const local = loadLocal()
        setSets(local)
      } else {
        const mapped = (data as CatalogRow[]).map(rowToSet)
        setSets(mapped)
        saveLocal(mapped)
      }
    } else {
      setSets(loadLocal())
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const addSet = useCallback(
    async (set: TcgSet) => {
      const sortOrder = sets.length
      const next = [...sets.filter((s) => s.id !== set.id), set].sort((a, b) =>
        b.releaseDate.localeCompare(a.releaseDate),
      )

      setSets(next)
      setSyncError(null)
      saveLocal(next)

      if (!supabaseConfigured || !supabase) return

      const { error } = await supabase
        .from('tcg_catalog_sets')
        .upsert(setToRow(set, sortOrder))

      if (error) {
        setSyncError(error.message)
        await reload()
        throw error
      }
    },
    [sets, reload],
  )

  const removeSet = useCallback(
    async (setId: string) => {
      const prev = sets
      const next = sets.filter((s) => s.id !== setId)
      setSets(next)
      setSyncError(null)
      saveLocal(next)

      if (!supabaseConfigured || !supabase) return

      const { error } = await supabase
        .from('tcg_catalog_sets')
        .delete()
        .eq('set_id', setId)

      if (error) {
        setSyncError(error.message)
        setSets(prev)
        saveLocal(prev)
        throw error
      }
    },
    [sets],
  )

  return {
    sets,
    loading,
    reload,
    addSet,
    removeSet,
    syncError,
    usingLocal: !supabaseConfigured,
  }
}
