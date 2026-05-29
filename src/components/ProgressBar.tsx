type Props = {
  collected: number
  total: number
}

export function ProgressBar({ collected, total }: Props) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg font-semibold text-slate-100">
          {collected}{' '}
          <span className="font-normal text-slate-400">/ {total} cartas</span>
        </p>
        <p className="font-mono text-2xl font-bold text-amber-400">{pct}%</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
