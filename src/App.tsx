import { useEffect, useMemo, useState } from 'react'
import { fetchNationalDex } from './lib/pokeapi'
import { useCollection } from './hooks/useCollection'
import type { FilterMode, PokemonEntry } from './types/pokemon'
import { FilterBar } from './components/FilterBar'
import { ProgressBar } from './components/ProgressBar'
import { PokemonCard } from './components/PokemonCard'

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

  const { collected, loading: collectionLoading, toggle, syncError, usingLocal } =
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

  const loading = listLoading || collectionLoading

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Colección TCG{' '}
            <span className="text-amber-400">Pokédex</span>
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Marca los Pokémon de los que ya tienes al menos una carta. El número
            nacional de la Pokédex es el identificador único.
          </p>
          {usingLocal && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Guardando en este navegador. Configura Supabase en{' '}
              <code className="text-amber-300">.env</code> para sincronizar entre
              dispositivos.
            </p>
          )}
          {syncError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Error de sincronización: {syncError}
            </p>
          )}
        </div>
      </header>

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

        {loading && (
          <p className="text-center text-slate-400">Cargando Pokédex…</p>
        )}

        {listError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {listError}
          </p>
        )}

        {!loading && !listError && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Mostrando {filtered.length} Pokémon
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((pokemon) => (
                <PokemonCard
                  key={pokemon.dexNumber}
                  pokemon={pokemon}
                  collected={collected.has(pokemon.dexNumber)}
                  onToggle={toggle}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-slate-500">
                Ningún Pokémon coincide con tu búsqueda.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
