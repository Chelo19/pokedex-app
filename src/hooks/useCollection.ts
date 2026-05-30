import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const LOCAL_KEY = 'tcg-collection-dex'

function loadLocal(): Set<number> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

function saveLocal(collected: Set<number>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...collected]))
}

export function useCollection() {
  const [collected, setCollected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setSyncError(null)

      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('collected_cards')
          .select('dex_number')

        if (cancelled) return

        if (error) {
          setSyncError(error.message)
          setCollected(loadLocal())
        } else {
          setCollected(new Set(data.map((row) => row.dex_number)))
        }
      } else {
        setCollected(loadLocal())
      }

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const addMany = useCallback(
    async (dexNumbers: number[]) => {
      const unique = [...new Set(dexNumbers)].filter((n) => !collected.has(n))
      if (unique.length === 0) return

      const prev = collected
      const next = new Set(collected)
      unique.forEach((n) => next.add(n))

      setCollected(next)
      setSyncError(null)

      if (!supabaseConfigured) {
        saveLocal(next)
        return
      }

      if (!supabase) return

      const { error } = await supabase
        .from('collected_cards')
        .upsert(unique.map((dex_number) => ({ dex_number })))

      if (error) {
        setSyncError(error.message)
        setCollected(prev)
        throw error
      }
    },
    [collected],
  )

  const removeMany = useCallback(
    async (dexNumbers: number[]) => {
      const unique = [...new Set(dexNumbers)].filter((n) => collected.has(n))
      if (unique.length === 0) return

      const prev = collected
      const next = new Set(collected)
      unique.forEach((n) => next.delete(n))

      setCollected(next)
      setSyncError(null)

      if (!supabaseConfigured) {
        saveLocal(next)
        return
      }

      if (!supabase) return

      const { error } = await supabase
        .from('collected_cards')
        .delete()
        .in('dex_number', unique)

      if (error) {
        setSyncError(error.message)
        setCollected(prev)
        throw error
      }
    },
    [collected],
  )

  return {
    collected,
    loading,
    addMany,
    removeMany,
    syncError,
    usingLocal: !supabaseConfigured,
  }
}
