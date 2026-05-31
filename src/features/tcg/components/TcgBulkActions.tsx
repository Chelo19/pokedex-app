import { useMemo } from 'react'
import type { TcgCard } from '../../../types/tcg'

export type TcgBulkMode = 'add' | 'remove' | null

type SharedProps = {
  mode: TcgBulkMode
  onModeChange: (mode: TcgBulkMode) => void
  selected: Set<string>
  onSelectedChange: (selected: Set<string>) => void
  missingInScope: TcgCard[]
  collectedInScope: TcgCard[]
  busy: boolean
}

type PanelProps = SharedProps & {
  allCards: TcgCard[]
  onConfirmAdd: (cardIds: string[]) => Promise<void>
  onConfirmRemove: (cardIds: string[]) => Promise<void>
}

export function TcgBulkModeTriggers({
  mode,
  onModeChange,
  onSelectedChange,
  missingInScope,
  collectedInScope,
  busy,
}: SharedProps) {
  if (mode !== null) return null

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={() => {
          onModeChange('add')
          onSelectedChange(new Set())
        }}
        disabled={missingInScope.length === 0 || busy}
        className="rounded-xl border border-emerald-600/50 bg-emerald-950/40 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Agregar cartas faltantes en lote
      </button>
      <button
        type="button"
        onClick={() => {
          onModeChange('remove')
          onSelectedChange(new Set())
        }}
        disabled={collectedInScope.length === 0 || busy}
        className="rounded-xl border border-red-600/50 bg-red-950/40 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Quitar cartas en lote
      </button>
    </div>
  )
}

export function TcgBulkSelectionPanel({
  mode,
  onModeChange,
  selected,
  onSelectedChange,
  allCards,
  missingInScope,
  collectedInScope,
  onConfirmAdd,
  onConfirmRemove,
  busy,
}: PanelProps) {
  if (mode === null) return null

  const selectedCards = useMemo(() => {
    const byId = new Map(allCards.map((c) => [c.id, c]))
    return [...selected]
      .map((id) => byId.get(id))
      .filter((c): c is TcgCard => c !== undefined)
      .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
  }, [selected, allCards])

  function exitMode() {
    onModeChange(null)
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
      /* syncError en hook */
    }
  }

  return (
    <div className="mt-8 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="mb-3 text-center text-sm text-slate-300">
        {mode === 'add' ? (
          <>
            Toca las cartas <span className="text-amber-400">faltantes</span> (
            {missingInScope.length} en esta vista).
          </>
        ) : (
          <>
            Toca las cartas <span className="text-amber-400">que tienes</span> (
            {collectedInScope.length} en esta vista).
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
          <ul className="max-h-96 space-y-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-2 sm:max-h-[28rem]">
            {selectedCards.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-slate-200 even:bg-slate-900/50"
              >
                <span>
                  <span className="font-mono text-xs text-slate-400">#{card.number}</span>{' '}
                  {card.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(selected)
                    next.delete(card.id)
                    onSelectedChange(next)
                  }}
                  disabled={busy}
                  className="shrink-0 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40"
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
