import { formatCardPrice } from '../../../lib/pokemontcg'
import type { TcgCard } from '../../../types/tcg'
import type { TcgBulkMode } from './TcgBulkActions'

type Props = {
  card: TcgCard
  collected: boolean
  bulkMode: TcgBulkMode
  bulkSelected: boolean
  onBulkSelect: (cardId: string) => void
}

export function TcgCardTile({
  card,
  collected,
  bulkMode,
  bulkSelected,
  onBulkSelect,
}: Props) {
  const canBulkAdd = bulkMode === 'add' && !collected
  const canBulkRemove = bulkMode === 'remove' && collected
  const selectable = canBulkAdd || canBulkRemove
  const priceLabel = formatCardPrice(card)

  const className = [
    'group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all',
    selectable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : '',
    bulkMode !== null && !selectable ? 'cursor-not-allowed opacity-40' : '',
    bulkSelected
      ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/60'
      : collected
        ? 'border-emerald-500 bg-emerald-950/40'
        : 'border-slate-700 bg-slate-900/60 opacity-80',
  ].join(' ')

  const content = (
    <>
      {bulkSelected && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-amber-950">
          ◉
        </span>
      )}
      {collected && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-950">
          ✓
        </span>
      )}
      <div className="aspect-[5/7] w-full bg-slate-950">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Sin imagen
          </div>
        )}
      </div>
      <div className="px-2 py-2">
        <p className="font-mono text-xs text-slate-400">#{card.number}</p>
        <p className="truncate text-sm font-medium text-slate-100">{card.name}</p>
        {priceLabel ? (
          card.priceUrl && !selectable ? (
            <a
              href={card.priceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 block text-xs font-medium text-violet-300 hover:text-violet-200 hover:underline"
            >
              {priceLabel}
            </a>
          ) : (
            <p
              role={card.priceUrl ? 'link' : undefined}
              tabIndex={card.priceUrl ? 0 : undefined}
              onClick={
                card.priceUrl
                  ? (e) => {
                      e.stopPropagation()
                      window.open(card.priceUrl, '_blank', 'noopener,noreferrer')
                    }
                  : undefined
              }
              onKeyDown={
                card.priceUrl
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        window.open(card.priceUrl, '_blank', 'noopener,noreferrer')
                      }
                    }
                  : undefined
              }
              className={[
                'mt-0.5 text-xs font-medium text-violet-300/90',
                card.priceUrl ? 'cursor-pointer hover:text-violet-200 hover:underline' : '',
              ].join(' ')}
            >
              {priceLabel}
            </p>
          )
        ) : (
          <p className="mt-0.5 text-xs text-slate-600">Sin precio</p>
        )}
      </div>
    </>
  )

  if (selectable) {
    return (
      <button type="button" onClick={() => onBulkSelect(card.id)} className={className}>
        {content}
      </button>
    )
  }

  return <article className={className}>{content}</article>
}
