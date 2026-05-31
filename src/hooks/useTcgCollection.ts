import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const LOCAL_KEY = 'tcg-cards-collection-v1'

function loadLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveLocal(collected: Set<string>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...collected]))
}

export function useTcgCollection() {
  const [collected, setCollected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setSyncError(null)

      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('collected_tcg_cards')
          .select('card_id')

        if (cancelled) return

        if (error) {
          setSyncError(error.message)
          setCollected(loadLocal())
        } else {
          setCollected(new Set(data.map((row) => row.card_id)))
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
    async (cardIds: string[], setId: string) => {
      const unique = [...new Set(cardIds)].filter((id) => !collected.has(id))
      if (unique.length === 0) return

      const prev = collected
      const next = new Set(collected)
      unique.forEach((id) => next.add(id))

      setCollected(next)
      setSyncError(null)

      if (!supabaseConfigured) {
        saveLocal(next)
        return
      }

      if (!supabase) return

      const { error } = await supabase
        .from('collected_tcg_cards')
        .upsert(unique.map((card_id) => ({ card_id, set_id: setId })))

      if (error) {
        setSyncError(error.message)
        setCollected(prev)
        throw error
      }
    },
    [collected],
  )

  const removeMany = useCallback(
    async (cardIds: string[]) => {
      const unique = [...new Set(cardIds)].filter((id) => collected.has(id))
      if (unique.length === 0) return

      const prev = collected
      const next = new Set(collected)
      unique.forEach((id) => next.delete(id))

      setCollected(next)
      setSyncError(null)

      if (!supabaseConfigured) {
        saveLocal(next)
        return
      }

      if (!supabase) return

      const { error } = await supabase
        .from('collected_tcg_cards')
        .delete()
        .in('card_id', unique)

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
