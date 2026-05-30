import { useMemo } from 'react'
import type { PokemonEntry } from '../types/pokemon'

export type BulkMode = 'add' | 'remove' | null

type Props = {
  mode: BulkMode
  onModeChange: (mode: BulkMode) => void
  selected: Set<number>
  onSelectedChange: (selected: Set<number>) => void
  pokemonList: PokemonEntry[]
  missingInScope: PokemonEntry[]
  collectedInScope: PokemonEntry[]
  onConfirmAdd: (dexNumbers: number[]) => Promise<void>
  onConfirmRemove: (dexNumbers: number[]) => Promise<void>
  busy: boolean
}

export function BulkActions({
  mode,
  onModeChange,
  selected,
  onSelectedChange,
  pokemonList,
  missingInScope,
  collectedInScope,
  onConfirmAdd,
  onConfirmRemove,
  busy,
}: Props) {
  const missingCount = missingInScope.length
  const collectedCount = collectedInScope.length

  const selectedPokemon = useMemo(() => {
    const byDex = new Map(pokemonList.map((p) => [p.dexNumber, p]))
    return [...selected]
      .sort((a, b) => a - b)
      .map((dex) => byDex.get(dex))
      .filter((p): p is PokemonEntry => p !== undefined)
  }, [selected, pokemonList])

  function removeFromSelection(dexNumber: number) {
    const next = new Set(selected)
    next.delete(dexNumber)
    onSelectedChange(next)
  }

  function exitMode() {
    onModeChange(null)
    onSelectedChange(new Set())
  }

  function startAddMode() {
    onModeChange('add')
    onSelectedChange(new Set())
  }

  function startRemoveMode() {
    onModeChange('remove')
    onSelectedChange(new Set())
  }

  async function handleConfirm() {
    const ids = [...selected]
    if (ids.length === 0) return
    try {
      if (mode === 'add') await onConfirmAdd(ids)
      else if (mode === 'remove') await onConfirmRemove(ids)
      exitMode()
    } catch {
      /* syncError handled in hook */
    }
  }

  if (mode === null) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={startAddMode}
          disabled={missingCount === 0 || busy}
          className="rounded-xl border border-emerald-600/50 bg-emerald-950/40 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Agregar faltantes en lote
        </button>
        <button
          type="button"
          onClick={startRemoveMode}
          disabled={collectedCount === 0 || busy}
          className="rounded-xl border border-red-600/50 bg-red-950/40 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Quitar coleccionadas en lote
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="mb-3 text-center text-sm text-slate-300">
        {mode === 'add' ? (
          <>
            Toca las cartas <span className="text-amber-400">faltantes</span> que quieres
            agregar ({missingCount} disponibles en esta vista).
          </>
        ) : (
          <>
            Toca las cartas <span className="text-amber-400">coleccionadas</span> que quieres
            quitar ({collectedCount} en esta vista).
          </>
        )}
      </p>

      <p className="mb-2 text-center text-sm font-medium text-slate-200">
        Seleccionadas: {selected.size}
      </p>

      {selected.size > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs text-slate-500">
            Revisa antes de confirmar:
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-2">
            {selectedPokemon.map((pokemon) => (
              <li
                key={pokemon.dexNumber}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-slate-200 even:bg-slate-900/50"
              >
                <span>
                  <span className="font-mono text-xs text-slate-400">
                    #{String(pokemon.dexNumber).padStart(4, '0')}
                  </span>{' '}
                  {pokemon.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromSelection(pokemon.dexNumber)}
                  disabled={busy}
                  className="shrink-0 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40"
                  aria-label={`Quitar ${pokemon.name} de la selección`}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={exitMode}
          disabled={busy}
          className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0 || busy}
          className={[
            'rounded-xl px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40',
            mode === 'add'
              ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
              : 'bg-red-500 text-red-950 hover:bg-red-400',
          ].join(' ')}
        >
          {busy
            ? 'Guardando…'
            : mode === 'add'
              ? `Confirmar agregar (${selected.size})`
              : `Confirmar quitar (${selected.size})`}
        </button>
      </div>
    </div>
  )
}
