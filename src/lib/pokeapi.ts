import type { PokemonEntry } from '../types/pokemon'

const NATIONAL_DEX_URL = 'https://pokeapi.co/api/v2/pokedex/national'
const CACHE_KEY = 'pokedex-national-v1'

type NationalDexResponse = {
  pokemon_entries: Array<{
    entry_number: number
    pokemon_species: { name: string; url: string }
  }>
}

function formatName(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function speciesIdFromUrl(url: string): number {
  const id = url.match(/\/(\d+)\/?$/)?.[1]
  return id ? Number(id) : 0
}

function parseNationalDex(data: NationalDexResponse): PokemonEntry[] {
  return data.pokemon_entries.map((entry) => ({
    dexNumber: entry.entry_number,
    name: formatName(entry.pokemon_species.name),
    speciesId: speciesIdFromUrl(entry.pokemon_species.url),
  }))
}

export function spriteUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`
}

export async function fetchNationalDex(): Promise<PokemonEntry[]> {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    return JSON.parse(cached) as PokemonEntry[]
  }

  const res = await fetch(NATIONAL_DEX_URL)
  if (!res.ok) {
    throw new Error('No se pudo cargar la Pokédex nacional')
  }

  const data = (await res.json()) as NationalDexResponse
  const entries = parseNationalDex(data)
  localStorage.setItem(CACHE_KEY, JSON.stringify(entries))
  return entries
}
