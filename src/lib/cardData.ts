// Pure data constants – no React imports, safe to use anywhere
import type { CardRarity } from '../types/database'

// Helper to build element icon URL from /elements/
export function getElementIconUrl(elementName?: string): string {
  if (!elementName) return '/elements/Spectro.webp'
  const normalized = elementName.charAt(0).toUpperCase() + elementName.slice(1).toLowerCase()
  return `/elements/${normalized}.webp`
}

export const ELEMENT_MAP: Record<string, { label: string; color: string; bg: string; iconUrl: string }> = {
  Spectro: { label: 'طيف (Spectro)',  color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.25)', iconUrl: '/elements/Spectro.webp' },
  Havoc:   { label: 'دمار (Havoc)',   color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.25)',  iconUrl: '/elements/Havoc.webp'   },
  Aero:    { label: 'رياح (Aero)',    color: '#34d399', bg: 'rgba(52, 211, 153, 0.25)', iconUrl: '/elements/Aero.webp'    },
  Electro: { label: 'برق (Electro)', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.25)', iconUrl: '/elements/Electro.webp' },
  Fusion:  { label: 'نار (Fusion)',   color: '#f97316', bg: 'rgba(249, 115, 22, 0.25)', iconUrl: '/elements/Fusion.webp'  },
  Glacio:  { label: 'جليد (Glacio)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.25)', iconUrl: '/elements/Glacio.webp'  },
}

export const RARITY_LABELS: Record<CardRarity, { label: string; stars: number; color: string }> = {
  common:    { label: 'شائع (Common)',       stars: 1, color: '#94a3b8' },
  rare:      { label: 'نادر (Rare)',          stars: 2, color: '#38bdf8' },
  epic:      { label: 'ملحمي (Epic)',         stars: 3, color: '#c084fc' },
  legendary: { label: 'أسطوري (Legendary)',   stars: 4, color: '#facc15' },
  mythic:    { label: 'خرافي (Mythic)',       stars: 5, color: '#f472b6' },
}
