export type TcgSet = {
  id: string
  name: string
  series: string
  releaseDate: string
  total: number
  logoUrl?: string
}

export type TcgCard = {
  id: string
  name: string
  number: string
  setId: string
  setName: string
  imageUrl: string
  /** TCGPlayer market (USD), si la API lo trae */
  priceUsd?: number
  priceUpdatedAt?: string
  priceUrl?: string
}

export type TcgFilterMode = 'all' | 'collected' | 'missing'
