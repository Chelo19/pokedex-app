import { useState } from 'react'
import { useTcgCatalog } from '../../hooks/useTcgCatalog'
import { fetchSetById } from '../../lib/pokemontcg'

export function AdminModule() {
  const { sets, loading, addSet, removeSet, syncError, usingLocal, reload } =
    useTcgCatalog()
  const [setIdInput, setSetIdInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    const id = setIdInput.trim().toLowerCase()
    if (!id) return

    if (sets.some((s) => s.id === id)) {
      setError('Ese set ya está en el catálogo.')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const set = await fetchSetById(id)
      await addSet(set)
      setSetIdInput('')
      setMessage(`Agregado: ${set.name} (${set.total} cartas)`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se encontró el set. Revisa el id en pokemontcg.io',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(setId: string) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await removeSet(setId)
      setMessage('Set eliminado del catálogo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {usingLocal && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Catálogo solo en este navegador. Ejecuta{' '}
          <code className="text-amber-300">schema-tcg-catalog.sql</code> en Supabase.
        </p>
      )}
      {syncError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Error de sincronización: {syncError}
        </p>
      )}

      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
        <label htmlFor="set-id" className="mb-3 block text-sm text-slate-400">
          Id del set
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="set-id"
            type="text"
            value={setIdInput}
            onChange={(e) => setSetIdInput(e.target.value)}
            placeholder="ej. sv8"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-4 py-2.5 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || !setIdInput.trim()}
            className="rounded-lg bg-sky-500 px-6 py-2.5 font-semibold text-sky-950 hover:bg-sky-400 disabled:opacity-40"
          >
            {busy ? 'Buscando…' : 'Agregar set'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Busca el id en{' '}
          <a
            href="https://pokemontcg.io"
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline"
          >
            pokemontcg.io
          </a>{' '}
          (cada expansión tiene un código corto).
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">
          Catálogo ({sets.length} expansiones)
        </h3>
        <button
          type="button"
          onClick={() => reload()}
          disabled={loading}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Recargar
        </button>
      </div>

      {loading && sets.length === 0 && (
        <p className="text-slate-500">Cargando catálogo…</p>
      )}

      {!loading && sets.length === 0 && (
        <p className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-8 text-center text-slate-500">
          No hay expansiones. Agrega un set arriba para empezar.
        </p>
      )}

      <ul className="space-y-2">
        {sets.map((set) => (
          <li
            key={set.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs text-slate-500">{set.id}</p>
              <p className="truncate font-medium text-slate-100">{set.name}</p>
              <p className="text-xs text-slate-400">
                {set.series} · {set.total} cartas · {set.releaseDate}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(set.id)}
              disabled={busy}
              className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/50 disabled:opacity-40"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
