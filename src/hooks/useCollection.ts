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

  const toggle = useCallback(
    async (dexNumber: number) => {
      const wasCollected = collected.has(dexNumber)
      const next = new Set(collected)
      if (wasCollected) next.delete(dexNumber)
      else next.add(dexNumber)

      setCollected(next)
      setSyncError(null)

      if (!supabaseConfigured) {
        saveLocal(next)
        return
      }

      if (!supabase) return

      if (wasCollected) {
        const { error } = await supabase
          .from('collected_cards')
          .delete()
          .eq('dex_number', dexNumber)
        if (error) {
          setSyncError(error.message)
          setCollected(collected)
        }
      } else {
        const { error } = await supabase
          .from('collected_cards')
          .upsert({ dex_number: dexNumber })
        if (error) {
          setSyncError(error.message)
          setCollected(collected)
        }
      }
    },
    [collected],
  )

  return { collected, loading, toggle, syncError, usingLocal: !supabaseConfigured }
}
