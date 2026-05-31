import { useEffect, useState } from 'react'

export type AppModule = 'dex' | 'tcg' | 'admin'

type Props = {
  active: AppModule
  onChange: (module: AppModule) => void
}

const items: { id: AppModule; label: string; activeClass: string }[] = [
  { id: 'dex', label: 'Pokédex', activeClass: 'bg-amber-500/20 text-amber-300' },
  { id: 'tcg', label: 'Cartas TCG', activeClass: 'bg-violet-500/20 text-violet-300' },
  { id: 'admin', label: 'Admin', activeClass: 'bg-sky-500/20 text-sky-300' },
]

export function ModuleNav({ active, onChange }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function selectModule(id: AppModule) {
    onChange(id)
    setOpen(false)
  }

  const activeLabel = items.find((i) => i.id === active)?.label ?? ''

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/95 text-slate-200 shadow-lg backdrop-blur transition hover:border-slate-500 hover:bg-slate-800"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)' }}
        aria-label="Abrir menú de navegación"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="sr-only">Menú</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
          aria-hidden
        >
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed left-0 top-0 z-50 flex h-full w-[min(18rem,85vw)] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl"
            aria-label="Navegación principal"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <span className="text-sm font-semibold text-slate-300">Menú</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label="Cerrar menú"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <p className="px-4 py-3 text-xs text-slate-500">
              Actual: <span className="text-slate-300">{activeLabel}</span>
            </p>

            <div className="flex flex-col gap-1 px-3 pb-6">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectModule(item.id)}
                  aria-current={active === item.id ? 'page' : undefined}
                  className={[
                    'rounded-lg px-4 py-3 text-left text-base font-medium transition',
                    active === item.id
                      ? item.activeClass
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </>
      )}
    </>
  )
}
