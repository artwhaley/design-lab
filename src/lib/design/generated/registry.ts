import type { DesignDefinition, DesignKey } from '../types'
import design_0 from '@/designs/obsidian'
import { DESIGN_KEYS, isDesignKey } from './designKeys'
import { DESIGN_CATALOG, type DesignCatalogEntry } from './catalog'
function eraseConfig<T extends object>(definition: DesignDefinition<T>): DesignDefinition { return definition as unknown as DesignDefinition }
export const DESIGNS: Record<DesignKey, DesignDefinition> = { "obsidian": eraseConfig(design_0) }
type RegistryGlobals = { __loreforgeLabRegistryOverride?: Map<string, unknown> }
function getLegacyTestOverride(): DesignDefinition[] | null {
  const override = (globalThis as unknown as RegistryGlobals).__loreforgeLabRegistryOverride
  return override ? [...override.values()] as DesignDefinition[] : null
}
export function getDesignDefinitions(): DesignDefinition[] { return getLegacyTestOverride() ?? DESIGN_KEYS.map((key) => DESIGNS[key]) }
export function getDesignDefinition(key: string): DesignDefinition | undefined {
  const override = getLegacyTestOverride()
  return override?.find((definition) => definition.key === key) ?? (isDesignKey(key) ? DESIGNS[key] : undefined)
}
export const DESIGN_METADATA: DesignCatalogEntry[] = DESIGN_KEYS.map((key) => ({ ...DESIGN_CATALOG.find((entry) => entry.key === key)! }))
