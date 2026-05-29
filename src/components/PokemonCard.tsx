import type { PokemonEntry } from '../types/pokemon'
import { spriteUrl } from '../lib/pokeapi'

type Props = {
  pokemon: PokemonEntry
  collected: boolean
  onToggle: (dexNumber: number) => void
}

export function PokemonCard({ pokemon, collected, onToggle }: Props) {
  const { dexNumber, name } = pokemon

  return (
    <button
      type="button"
      onClick={() => onToggle(dexNumber)}
      className={[
        'group relative flex flex-col items-center rounded-xl border-2 p-3 text-left transition-all',
        'hover:scale-[1.02] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        collected
          ? 'border-emerald-500 bg-emerald-950/40 shadow-emerald-900/30'
          : 'border-slate-700 bg-slate-900/60 opacity-75 hover:opacity-100',
      ].join(' ')}
      aria-pressed={collected}
      aria-label={`${name} #${dexNumber}${collected ? ', carta obtenida' : ', sin carta'}`}
    >
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
          collected ? '' : 'grayscale group-hover:grayscale-0',
        ].join(' ')}
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.visibility = 'hidden'
        }}
      />
      <span className="mt-1 w-full truncate text-center text-sm font-medium text-slate-100">
        {name}
      </span>
    </button>
  )
}
