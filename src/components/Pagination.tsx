type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8"
      aria-label="Paginación"
    >
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
    </nav>
  )
}
