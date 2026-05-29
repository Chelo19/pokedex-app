import type { FilterMode } from '../types/pokemon'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  filter: FilterMode
  onFilterChange: (mode: FilterMode) => void
}

const filters: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'collected', label: 'Con carta' },
  { id: 'missing', label: 'Faltantes' },
]

export function FilterBar({ search, onSearchChange, filter, onFilterChange }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <input
        type="search"
        placeholder="Buscar por nombre o número…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:max-w-md"
      />
      <div className="flex shrink-0 gap-2 rounded-lg bg-slate-900/80 p-1">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onFilterChange(id)}
            className={[
              'rounded-md px-4 py-2 text-sm font-medium transition',
              filter === id
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-100',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
