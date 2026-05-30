import { useEffect, useState } from 'react'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function clampPage(value: number, totalPages: number) {
  return Math.min(Math.max(1, value), totalPages)
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  const [pageInput, setPageInput] = useState(String(page))

  useEffect(() => {
    setPageInput(String(page))
  }, [page])

  if (totalPages <= 1) return null

  function goToPage() {
    const parsed = parseInt(pageInput, 10)
    if (Number.isNaN(parsed)) {
      setPageInput(String(page))
      return
    }
    onPageChange(clampPage(parsed, totalPages))
  }

  return (
    <nav
      className="mt-8 flex w-full max-w-3xl flex-col items-center gap-4"
      aria-label="Paginación"
    >
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="min-w-[11rem] rounded-2xl border-2 border-slate-600 bg-slate-900 px-10 py-5 text-lg font-bold text-slate-100 transition hover:border-amber-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[13rem] sm:px-12 sm:py-6 sm:text-xl"
        >
          Anterior
        </button>
        <span className="min-w-[10rem] text-center text-lg text-slate-400 sm:min-w-[12rem] sm:text-xl">
          Página{' '}
          <span className="font-medium text-slate-200">{page}</span> de{' '}
          <span className="font-medium text-slate-200">{totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="min-w-[11rem] rounded-2xl border-2 border-slate-600 bg-slate-900 px-10 py-5 text-lg font-bold text-slate-100 transition hover:border-amber-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[13rem] sm:px-12 sm:py-6 sm:text-xl"
        >
          Siguiente
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label htmlFor="page-jump" className="text-sm text-slate-400">
          Ir a página
        </label>
        <input
          id="page-jump"
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToPage()
          }}
          className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-center text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="button"
          onClick={goToPage}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-700"
        >
          Ir
        </button>
      </div>
    </nav>
  )
}
