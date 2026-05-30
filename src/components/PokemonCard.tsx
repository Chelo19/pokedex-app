import type { PokemonEntry } from '../types/pokemon'
import { spriteUrl } from '../lib/pokeapi'

type Props = {
  pokemon: PokemonEntry
  collected: boolean
  bulkMode?: 'add' | 'remove' | null
  bulkSelected?: boolean
  onBulkSelect?: (dexNumber: number) => void
}

export function PokemonCard({
  pokemon,
  collected,
  bulkMode = null,
  bulkSelected = false,
  onBulkSelect,
}: Props) {
  const { dexNumber, name } = pokemon

  const canBulkAdd = bulkMode === 'add' && !collected
  const canBulkRemove = bulkMode === 'remove' && collected
  const selectable = canBulkAdd || canBulkRemove

  const className = [
    'group relative flex flex-col items-center rounded-xl border-2 p-3 text-left transition-all',
    selectable
      ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
      : '',
    bulkMode !== null && !selectable ? 'opacity-40' : '',
    bulkSelected
      ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/60'
      : collected
        ? 'border-emerald-500 bg-emerald-950/40 shadow-emerald-900/30'
        : 'border-slate-700 bg-slate-900/60 opacity-75',
  ].join(' ')

  const content = (
    <>
      {bulkSelected && (
        <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-amber-950">
          ◉
        </span>
      )}
      {collected && (
        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-950">
          ✓
        </span>
      )}
      <span className="mb-1 font-mono text-xs text-slate-400">
        #{String(dexNumber).padStart(4, '0')}
      </span>
      <img
        src={spriteUrl(dexNumber)}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        className={[
          'h-24 w-24 object-contain transition',
          collected ? '' : 'grayscale',
          selectable ? 'group-hover:grayscale-0' : '',
        ].join(' ')}
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.visibility = 'hidden'
        }}
      />
      <span className="mt-1 w-full truncate text-center text-sm font-medium text-slate-100">
        {name}
      </span>
    </>
  )

  if (selectable && onBulkSelect) {
    return (
      <button
        type="button"
        onClick={() => onBulkSelect(dexNumber)}
        className={className}
        aria-pressed={bulkSelected}
        aria-label={`${name} #${dexNumber}, seleccionar para ${bulkMode === 'add' ? 'agregar' : 'quitar'}`}
      >
        {content}
      </button>
    )
  }

  return (
    <article
      className={className}
      aria-label={`${name} #${dexNumber}${collected ? ', carta obtenida' : ', sin carta'}`}
    >
      {content}
    </article>
  )
}
