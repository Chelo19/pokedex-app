import { useEffect, useMemo, useState } from 'react'
import { useTcgCatalog } from '../../hooks/useTcgCatalog'
import { useTcgCollection } from '../../hooks/useTcgCollection'
import { fetchCardsBySet, filterTcgCards, getCachedCardsBySet } from '../../lib/pokemontcg'
import type { TcgCard, TcgFilterMode } from '../../types/tcg'
import { Pagination } from '../../components/Pagination'
import { ProgressBar } from '../../components/ProgressBar'
import {
  TcgBulkModeTriggers,
  TcgBulkSelectionPanel,
  type TcgBulkMode,
} from './components/TcgBulkActions'
import { TcgCardTile } from './components/TcgCardTile'
import { TcgFilterBar } from './components/TcgFilterBar'

const PAGE_SIZE = 9
const SET_STORAGE_KEY = 'tcg-selected-set-id'

export function TcgModule() {
  const {
    sets,
    loading: catalogLoading,
    syncError: catalogSyncError,
    usingLocal: catalogLocal,
  } = useTcgCatalog()
  const [selectedSetId, setSelectedSetId] = useState(
    () => localStorage.getItem(SET_STORAGE_KEY) ?? '',
  )
  const [cards, setCards] = useState<TcgCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [cardsError, setCardsError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TcgFilterMode>('all')
  const [page, setPage] = useState(1)
  const [bulkMode, setBulkMode] = useState<TcgBulkMode>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(() => new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [setPickerSearch, setSetPickerSearch] = useState('')

  const { collected, loading: collectionLoading, addMany, removeMany, syncError, usingLocal } =
    useTcgCollection()

  const selectedSet = sets.find((s) => s.id === selectedSetId) ?? null

  useEffect(() => {
    if (sets.length === 0) return
    const stored = localStorage.getItem(SET_STORAGE_KEY) ?? ''
    const valid = sets.some((s) => s.id === stored)
    if (valid) setSelectedSetId(stored)
    else setSelectedSetId(sets[0].id)
  }, [sets])

  useEffect(() => {
    const set = sets.find((s) => s.id === selectedSetId)
    if (!set) return

    localStorage.setItem(SET_STORAGE_KEY, set.id)
    setCardsError(null)
    setPage(1)
    setSearch('')
    setBulkMode(null)
    setBulkSelected(new Set())

    const cachedCards = getCachedCardsBySet(set.id)
    if (cachedCards) {
      setCards(cachedCards)
      setCardsLoading(false)
      fetchCardsBySet(set)
        .then(setCards)
        .catch(() => {})
    } else {
      setCardsLoading(true)
      fetchCardsBySet(set)
        .then(setCards)
        .catch((err: Error) => setCardsError(err.message))
        .finally(() => setCardsLoading(false))
    }
  }, [selectedSetId, sets])

  const hasBulkSelection = bulkSelected.size > 0

  useEffect(() => {
    if (!hasBulkSelection) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasBulkSelection])

  const collectedInSet = useMemo(() => {
    return cards.filter((c) => collected.has(c.id)).length
  }, [cards, collected])

  const filtered = useMemo(
    () => filterTcgCards(cards, search, filter, collected),
    [cards, search, filter, collected],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage((current) => (current > totalPages ? totalPages : current))
  }, [totalPages])

  const missingInScope = useMemo(
    () => filtered.filter((c) => !collected.has(c.id)),
    [filtered, collected],
  )

  const collectedInScope = useMemo(
    () => filtered.filter((c) => collected.has(c.id)),
    [filtered, collected],
  )

  const filteredSets = useMemo(() => {
    const q = setPickerSearch.trim().toLowerCase()
    if (!q) return sets
    return sets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.series.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    )
  }, [sets, setPickerSearch])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFilterChange(mode: TcgFilterMode) {
    setFilter(mode)
    setPage(1)
  }

  function toggleBulkSelect(cardId: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  async function confirmBulkAdd(ids: string[]) {
    if (!selectedSet) return
    setBulkBusy(true)
    try {
      await addMany(ids, selectedSet.id)
    } finally {
      setBulkBusy(false)
    }
  }

  async function confirmBulkRemove(ids: string[]) {
    setBulkBusy(true)
    try {
      await removeMany(ids)
    } finally {
      setBulkBusy(false)
    }
  }

  const loading = catalogLoading || collectionLoading
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {(usingLocal || catalogLocal) && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Guardando en este navegador. Configura Supabase para sincronizar.
        </p>
      )}
      {(syncError || catalogSyncError) && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Error de sincronización: {syncError ?? catalogSyncError}
        </p>
      )}

      <div className="mb-8 flex flex-col gap-3">
        <label htmlFor="tcg-set-search" className="block text-sm text-slate-400">
          Expansión / set
        </label>
        <input
          id="tcg-set-search"
          type="search"
          value={setPickerSearch}
          onChange={(e) => setSetPickerSearch(e.target.value)}
          placeholder="Filtrar expansiones…"
          disabled={sets.length === 0}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-slate-100 sm:max-w-md disabled:opacity-50"
        />
        <select
          id="tcg-set"
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value)}
          disabled={sets.length === 0}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:max-w-xl disabled:opacity-50"
        >
          {filteredSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name} ({set.series}) — {set.total} cartas
            </option>
          ))}
        </select>
        {!catalogLoading && sets.length === 0 && (
          <p className="mt-3 text-sm text-amber-200/90">
            No hay expansiones. Ve a la pestaña <strong>Admin</strong> y agrega los
            sets que quieras coleccionar.
          </p>
        )}
      </div>

      {loading && sets.length === 0 && (
        <p className="text-center text-slate-400">Cargando catálogo…</p>
      )}

      {cardsLoading && selectedSet && (
        <p className="text-center text-slate-400">
          Cargando cartas de {selectedSet.name}…
        </p>
      )}

      {cardsError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {cardsError}
        </p>
      )}

      {!cardsLoading && !cardsError && selectedSet && cards.length > 0 && (
        <>
          <div className="mb-8">
            <ProgressBar collected={collectedInSet} total={cards.length} />
            <p className="mt-2 text-center text-xs text-slate-500">
              {selectedSet.name} · {collectedInSet} de {cards.length} en tu colección
            </p>
          </div>

          <div className="mb-8">
            <TcgFilterBar
              search={search}
              onSearchChange={handleSearchChange}
              filter={filter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {bulkMode === null && (
            <div className="mx-auto mb-8 w-full max-w-3xl">
              <TcgBulkModeTriggers
                mode={bulkMode}
                onModeChange={setBulkMode}
                selected={bulkSelected}
                onSelectedChange={setBulkSelected}
                missingInScope={missingInScope}
                collectedInScope={collectedInScope}
                busy={bulkBusy}
              />
            </div>
          )}

          <section className="mx-auto flex w-full max-w-3xl flex-col items-center">
            <p className="mb-4 text-center text-sm text-slate-500">
              {filtered.length === 0
                ? 'Sin resultados'
                : `Mostrando ${rangeStart}–${rangeEnd} de ${filtered.length} cartas`}
            </p>
            <div className="grid w-full grid-cols-3 gap-3">
              {paginated.map((card) => (
                <TcgCardTile
                  key={card.id}
                  card={card}
                  collected={collected.has(card.id)}
                  bulkMode={bulkMode}
                  bulkSelected={bulkSelected.has(card.id)}
                  onBulkSelect={toggleBulkSelect}
                />
              ))}
            </div>
            <Pagination
              key={`${selectedSet.id}-${filter}-${search}`}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
            {bulkMode !== null && (
              <TcgBulkSelectionPanel
                mode={bulkMode}
                onModeChange={setBulkMode}
                selected={bulkSelected}
                onSelectedChange={setBulkSelected}
                allCards={cards}
                missingInScope={missingInScope}
                collectedInScope={collectedInScope}
                onConfirmAdd={confirmBulkAdd}
                onConfirmRemove={confirmBulkRemove}
                busy={bulkBusy}
              />
            )}
          </section>
        </>
      )}
    </main>
  )
}
