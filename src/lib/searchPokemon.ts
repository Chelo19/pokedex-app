import type { PokemonEntry } from '../types/pokemon'

function normalizeMatchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
}

export function filterPokemonByQuery(
  list: PokemonEntry[],
  query: string,
  limit = 8,
): PokemonEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const matches = list.filter((p) => {
    if (/^\d+$/.test(q)) {
      return String(p.dexNumber).includes(q)
    }
    return p.name.toLowerCase().includes(q)
  })

  return matches.slice(0, limit)
}

export function pokemonMatchesQuery(pokemon: PokemonEntry, query: string): boolean {
  if (!query.trim()) return true
  return filterPokemonByQuery([pokemon], query, 1).length > 0
}

/** Intenta identificar Pokémon a partir del texto OCR de la carta. */
export function guessPokemonCandidatesFromOcr(
  ocrText: string,
  list: PokemonEntry[],
  limit = 5,
): PokemonEntry[] {
  const seen = new Set<number>()
  const results: PokemonEntry[] = []

  function push(p: PokemonEntry) {
    if (seen.has(p.dexNumber)) return
    seen.add(p.dexNumber)
    results.push(p)
  }

  const lower = normalizeMatchText(ocrText)
  let bestDirect: PokemonEntry | null = null
  let bestLen = 0

  for (const p of list) {
    const name = normalizeMatchText(p.name)
    if (name.length < 3) continue
    if (lower.includes(name) && name.length > bestLen) {
      bestDirect = p
      bestLen = name.length
    }
  }

  if (bestDirect) push(bestDirect)

  const chunks = [
    ...ocrText.split(/[\n\r]+/),
    ...ocrText.split(/\s{2,}/),
  ]
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)

  for (const chunk of chunks) {
    for (const p of filterPokemonByQuery(list, chunk, 15)) {
      push(p)
      if (results.length >= limit) return results
    }
  }

  const words = ocrText.split(/\s+/).filter((w) => w.replace(/\W/g, '').length >= 4)
  for (const word of words) {
    for (const p of filterPokemonByQuery(list, word, 10)) {
      push(p)
      if (results.length >= limit) return results
    }
  }

  return results.slice(0, limit)
}

export function guessPokemonFromOcr(
  ocrText: string,
  list: PokemonEntry[],
): PokemonEntry | null {
  return guessPokemonCandidatesFromOcr(ocrText, list, 1)[0] ?? null
}
