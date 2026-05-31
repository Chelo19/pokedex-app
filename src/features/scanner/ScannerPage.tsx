import { useEffect, useMemo, useRef, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { terminateOcrWorker, recognizeCardFromVideo, ensureOcrWorker } from '../../lib/ocr'
import {
  filterPokemonByQuery,
  guessPokemonCandidatesFromOcr,
} from '../../lib/searchPokemon'
import { spriteUrl } from '../../lib/pokeapi'
import type { PokemonEntry } from '../../types/pokemon'

type Props = {
  pokemonList: PokemonEntry[]
  collected: Set<number>
  onAdd: (dexNumber: number) => Promise<void>
  onBack: () => void
  busy: boolean
}

export function ScannerPage({
  pokemonList,
  collected,
  onAdd,
  onBack,
  busy,
}: Props) {
  const { videoRef, error: cameraError, ready } = useCamera(true)
  const jigFrameRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<PokemonEntry | null>(null)
  const [sessionAdded, setSessionAdded] = useState(0)
  const [sessionChecked, setSessionChecked] = useState(0)
  const [addError, setAddError] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrRaw, setOcrRaw] = useState<string | null>(null)
  const [ocrCandidates, setOcrCandidates] = useState<PokemonEntry[]>([])
  const [ocrPreparing, setOcrPreparing] = useState(false)

  const suggestions = useMemo(
    () => filterPokemonByQuery(pokemonList, query, 8),
    [pokemonList, query],
  )

  const displaySuggestions =
    ocrCandidates.length > 0 && !selected ? ocrCandidates : suggestions

  const inCollection = selected ? collected.has(selected.dexNumber) : false

  useEffect(() => {
    if (!ready) return
    setOcrPreparing(true)
    ensureOcrWorker()
      .catch(() => {})
      .finally(() => setOcrPreparing(false))

    return () => {
      terminateOcrWorker()
    }
  }, [ready])

  function selectPokemon(pokemon: PokemonEntry) {
    setSelected(pokemon)
    setQuery(pokemon.name)
    setAddError(null)
    setOcrError(null)
    setOcrCandidates([])
    setSessionChecked((n) => n + 1)
  }

  function nextCard() {
    setSelected(null)
    setQuery('')
    setAddError(null)
    setOcrError(null)
    setOcrRaw(null)
    setOcrCandidates([])
  }

  async function handleOcr() {
    const video = videoRef.current
    const jigFrame = jigFrameRef.current
    if (!video || !ready || !jigFrame) return

    setOcrLoading(true)
    setOcrError(null)
    setOcrRaw(null)
    setOcrCandidates([])
    setSelected(null)

    try {
      const text = await recognizeCardFromVideo(video, jigFrame)
      setOcrRaw(text)

      const candidates = guessPokemonCandidatesFromOcr(text, pokemonList, 5)
      if (candidates.length === 1) {
        selectPokemon(candidates[0])
      } else if (candidates.length > 1) {
        setOcrCandidates(candidates)
        setQuery(candidates[0].name)
      } else {
        const firstLine = text
          .split(/[\n\r]+/)
          .map((l) => l.trim())
          .find((l) => l.length >= 3)
        if (firstLine) setQuery(firstLine)
        setOcrError(
          'No se reconoció un Pokémon con certeza. Elige de la lista o corrige la búsqueda.',
        )
      }
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : 'Error al leer la carta',
      )
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleAdd() {
    if (!selected || inCollection) return
    setAddError(null)
    try {
      await onAdd(selected.dexNumber)
      setSessionAdded((n) => n + 1)
      nextCard()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const ocrBusy = ocrLoading || ocrPreparing

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          ← Colección
        </button>
        <h2 className="text-sm font-semibold text-amber-400">Modo escáner</h2>
        <span className="text-xs text-slate-500">
          {sessionChecked} rev. · +{sessionAdded}
        </span>
      </div>

      <div className="relative aspect-[5/7] w-full max-h-[50vh] shrink-0 bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {!ready && !cameraError && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Activando cámara…
          </p>
        )}
        {cameraError && (
          <p className="absolute inset-0 flex items-center justify-center bg-slate-950/90 px-6 text-center text-sm text-red-200">
            {cameraError}
          </p>
        )}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"
          aria-hidden
        >
          <div
            ref={jigFrameRef}
            className="h-full max-h-full w-full max-w-[min(100%,14rem)] rounded-lg border-2 border-dashed border-amber-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          />
        </div>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4">
          <button
            type="button"
            onClick={handleOcr}
            disabled={!ready || ocrBusy || !!cameraError}
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-amber-950 shadow-lg hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ocrLoading
              ? 'Leyendo carta…'
              : ocrPreparing
                ? 'Preparando OCR…'
                : 'Leer carta (OCR)'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {ocrRaw && (
          <p className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-500">
            OCR: {ocrRaw.replace(/\s+/g, ' ').trim().slice(0, 120)}
            {ocrRaw.length > 120 ? '…' : ''}
          </p>
        )}
        {ocrError && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {ocrError}
          </p>
        )}

        <div>
          <label htmlFor="scanner-search" className="mb-1 block text-sm text-slate-400">
            Nombre o número (OCR o manual)
          </label>
          <input
            id="scanner-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
              setAddError(null)
              setOcrCandidates([])
            }}
            placeholder="Ej. Pikachu o 25"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {query.trim() && !selected && displaySuggestions.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900">
              {ocrCandidates.length > 0 && !selected && (
                <li className="px-3 py-1.5 text-xs font-medium text-amber-400">
                  Sugerencias del OCR — confirma cuál es:
                </li>
              )}
              {displaySuggestions.map((pokemon) => (
                <li key={pokemon.dexNumber}>
                  <button
                    type="button"
                    onClick={() => selectPokemon(pokemon)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800"
                  >
                    <img
                      src={spriteUrl(pokemon.dexNumber)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                    />
                    <span>
                      <span className="font-mono text-xs text-slate-400">
                        #{String(pokemon.dexNumber).padStart(4, '0')}
                      </span>
                      <span className="ml-2 font-medium">{pokemon.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && !selected && displaySuggestions.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">Sin coincidencias</p>
          )}
        </div>

        {selected && (
          <div
            className={[
              'rounded-xl border-2 p-4',
              inCollection
                ? 'border-emerald-500/50 bg-emerald-950/40'
                : 'border-amber-500/50 bg-amber-950/30',
            ].join(' ')}
          >
            <div className="flex items-center gap-4">
              <img
                src={spriteUrl(selected.dexNumber)}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
              />
              <div>
                <p className="font-mono text-sm text-slate-400">
                  #{String(selected.dexNumber).padStart(4, '0')}
                </p>
                <p className="text-xl font-bold">{selected.name}</p>
                <p
                  className={[
                    'mt-1 text-sm font-semibold',
                    inCollection ? 'text-emerald-300' : 'text-amber-300',
                  ].join(' ')}
                >
                  {inCollection ? '✓ Ya en tu colección' : 'Falta en tu colección'}
                </p>
              </div>
            </div>
            {addError && (
              <p className="mt-3 text-sm text-red-300">{addError}</p>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pb-4">
          {selected && !inCollection && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
            >
              {busy ? 'Guardando…' : 'Agregar a colección'}
            </button>
          )}
          <button
            type="button"
            onClick={nextCard}
            className="w-full rounded-xl border border-slate-600 bg-slate-900 py-4 text-lg font-semibold text-slate-200 hover:bg-slate-800"
          >
            Siguiente carta
          </button>
          <button
            type="button"
            onClick={nextCard}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-300"
          >
            No es Pokémon / Saltar
          </button>
        </div>
      </div>
    </div>
  )
}
