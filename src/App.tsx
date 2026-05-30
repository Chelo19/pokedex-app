import { useEffect, useMemo, useState } from 'react'
import { fetchNationalDex } from './lib/pokeapi'
import { useCollection } from './hooks/useCollection'
import type { FilterMode, PokemonEntry } from './types/pokemon'
import { BulkModeTriggers, BulkSelectionPanel, type BulkMode } from './components/BulkActions'
import { FilterBar } from './components/FilterBar'
import { Pagination } from './components/Pagination'
import { ProgressBar } from './components/ProgressBar'
import { PokemonCard } from './components/PokemonCard'

const PAGE_SIZE = 9

function matchesSearch(pokemon: PokemonEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (/^\d+$/.test(q)) {
    return String(pokemon.dexNumber).includes(q)
  }
  return pokemon.name.toLowerCase().includes(q)
}

function App() {
  const [pokemonList, setPokemonList] = useState<PokemonEntry[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [page, setPage] = useState(1)
  const [bulkMode, setBulkMode] = useState<BulkMode>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(() => new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const { collected, loading: collectionLoading, addMany, removeMany } =
    useCollection()

  useEffect(() => {
    fetchNationalDex()
      .then(setPokemonList)
      .catch((err: Error) => setListError(err.message))
      .finally(() => setListLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return pokemonList.filter((p) => {
      if (!matchesSearch(p, search)) return false
      if (filter === 'collected') return collected.has(p.dexNumber)
      if (filter === 'missing') return !collected.has(p.dexNumber)
      return true
    })
  }, [pokemonList, search, filter, collected])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search, filter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  const missingInScope = useMemo(
    () => filtered.filter((p) => !collected.has(p.dexNumber)),
    [filtered, collected],
  )

  const collectedInScope = useMemo(
    () => filtered.filter((p) => collected.has(p.dexNumber)),
    [filtered, collected],
  )

  function toggleBulkSelect(dexNumber: number) {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(dexNumber)) next.delete(dexNumber)
      else next.add(dexNumber)
      return next
    })
  }

  async function confirmBulkAdd(ids: number[]) {
    setBulkBusy(true)
    try {
      await addMany(ids)
    } finally {
      setBulkBusy(false)
    }
  }

  async function confirmBulkRemove(ids: number[]) {
    setBulkBusy(true)
    try {
      await removeMany(ids)
    } finally {
      setBulkBusy(false)
    }
  }

  const loading = listLoading || collectionLoading

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!loading && pokemonList.length > 0 && (
          <div className="mb-8">
            <ProgressBar collected={collected.size} total={pokemonList.length} />
          </div>
        )}

        <div className="mb-8">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>

        {!loading && !listError && pokemonList.length > 0 && bulkMode === null && (
          <div className="mx-auto mb-8 w-full max-w-3xl">
            <BulkModeTriggers
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

        {loading && (
          <p className="text-center text-slate-400">Cargando Pokédex…</p>
        )}

        {listError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {listError}
          </p>
        )}

        {!loading && !listError && (
          <section className="mx-auto flex w-full max-w-3xl flex-col items-center">
            <p className="mb-4 text-center text-sm text-slate-500">
              {filtered.length === 0
                ? 'Sin resultados'
                : `Mostrando ${rangeStart}–${rangeEnd} de ${filtered.length} Pokémon`}
            </p>
            <div className="grid w-full grid-cols-3 gap-3">
              {paginated.map((pokemon) => (
                <PokemonCard
                  key={pokemon.dexNumber}
                  pokemon={pokemon}
                  collected={collected.has(pokemon.dexNumber)}
                  bulkMode={bulkMode}
                  bulkSelected={bulkSelected.has(pokemon.dexNumber)}
                  onBulkSelect={toggleBulkSelect}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
            {pokemonList.length > 0 && bulkMode !== null && (
              <BulkSelectionPanel
                mode={bulkMode}
                onModeChange={setBulkMode}
                selected={bulkSelected}
                onSelectedChange={setBulkSelected}
                pokemonList={pokemonList}
                missingInScope={missingInScope}
                collectedInScope={collectedInScope}
                onConfirmAdd={confirmBulkAdd}
                onConfirmRemove={confirmBulkRemove}
                busy={bulkBusy}
              />
            )}
            {filtered.length === 0 && (
              <p className="py-12 text-center text-slate-500">
                Ningún Pokémon coincide con tu búsqueda.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
