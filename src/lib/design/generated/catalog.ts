import type { DesignKey } from '../types'
import type { DesignStatus } from '../contracts'
export type DesignCatalogEntry = { key: DesignKey; status: DesignStatus; name: string; description: string; thumbnail: string }
export const DESIGN_CATALOG: readonly DesignCatalogEntry[] = [
  { key: "obsidian", status: "first-class", name: "Obsidian", description: "A night-harbour world: dark atmospheric surfaces, luminous accents, cinematic records.", thumbnail: "/design-assets/obsidian/thumbnail.svg" },
]
export const DESIGN_CATALOG_KEYS: readonly DesignKey[] = DESIGN_CATALOG.map((entry) => entry.key)
export const FIRST_CLASS_DESIGNS: readonly DesignKey[] = DESIGN_CATALOG.filter((entry) => entry.status === 'first-class').map((entry) => entry.key)
