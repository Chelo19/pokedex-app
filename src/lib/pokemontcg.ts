import type { TcgCard, TcgSet } from '../types/tcg'

const API_BASE = 'https://api.pokemontcg.io/v2'
const CARDS_CACHE_PREFIX = 'pokemontcg-cards-v4-'
const CARDS_PAGE_SIZE = 250
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

type CacheEnvelope<T> = { savedAt: number; data: T }

type SetResponse = {
  data: {
    id: string
    name: string
    series: string
    releaseDate: string
    total: number
    images?: { logo?: string }
  }
}

type CardsResponse = {
  data: Array<{
    id: string
    name: string
    number: string
    set: { id: string; name: string }
    images?: { small?: string; large?: string }
  }>
  totalCount: number
  page: number
  pageSize: number
}

function apiHeaders(): HeadersInit {
  const key = import.meta.env.VITE_POKEMON_TCG_API_KEY
  return key ? { 'X-Api-Key': key } : {}
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: apiHeaders() })
  if (!res.ok) {
    throw new Error(`Pokemon TCG API: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const env = JSON.parse(raw) as CacheEnvelope<T>
    if (Date.now() - env.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return env.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }))
}

/** Valida y obtiene datos de una expansión por su id (ej. sv8, base1). */
export async function fetchSetById(setId: string): Promise<TcgSet> {
  const id = setId.trim().toLowerCase()
  if (!id) throw new Error('Ingresa un id de set.')

  const json = await apiGet<SetResponse>(`/sets/${encodeURIComponent(id)}`)
  const s = json.data

  return {
    id: s.id,
    name: s.name,
    series: s.series,
    releaseDate: s.releaseDate,
    total: s.total,
    logoUrl: s.images?.logo,
  }
}

export function getCachedCardsBySet(setId: string): TcgCard[] | null {
  return readCache<TcgCard[]>(CARDS_CACHE_PREFIX + setId)
}

function mapCard(c: CardsResponse['data'][number]): TcgCard {
  return {
    id: c.id,
    name: c.name,
    number: c.number,
    setId: c.set.id,
    setName: c.set.name,
    imageUrl: c.images?.large ?? c.images?.small ?? '',
  }
}

/** Cartas de un set. La API v2 filtra con `q=set.id:xxx`, no con `set.id=` en la URL. */
export async function fetchCardsBySet(set: TcgSet): Promise<TcgCard[]> {
  const cacheKey = CARDS_CACHE_PREFIX + set.id
  const cached = readCache<TcgCard[]>(cacheKey)
  if (cached) return cached

  const query = encodeURIComponent(`set.id:${set.id}`)
  const all: TcgCard[] = []
  let page = 1
  let totalCount = Infinity

  while (all.length < totalCount) {
    const json = await apiGet<CardsResponse>(
      `/cards?q=${query}&orderBy=number&pageSize=${CARDS_PAGE_SIZE}&page=${page}`,
    )
    totalCount = json.totalCount

    for (const c of json.data) {
      if (c.set.id !== set.id) continue
      all.push(mapCard(c))
    }

    if (json.data.length === 0) break
    if (page * json.pageSize >= totalCount) break
    page += 1
  }

  const sorted = all.sort((a, b) => compareCardNumbers(a.number, b.number))
  writeCache(cacheKey, sorted)
  return sorted
}

function compareCardNumbers(a: string, b: string): number {
  const na = parseInt(a.replace(/\D/g, ''), 10)
  const nb = parseInt(b.replace(/\D/g, ''), 10)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
  return a.localeCompare(b, undefined, { numeric: true })
}

export function filterTcgCards(
  cards: TcgCard[],
  search: string,
  filter: 'all' | 'collected' | 'missing',
  collected: Set<string>,
): TcgCard[] {
  const q = search.trim().toLowerCase()

  return cards.filter((card) => {
    if (filter === 'collected' && !collected.has(card.id)) return false
    if (filter === 'missing' && collected.has(card.id)) return false
    if (!q) return true
    if (/^\d+$/.test(q)) {
      return card.number.replace(/\D/g, '').includes(q) || card.number.includes(q)
    }
    return (
      card.name.toLowerCase().includes(q) ||
      card.number.toLowerCase().includes(q) ||
      card.id.toLowerCase().includes(q)
    )
  })
}
