/**
 * Source-controlled static Design registry (Guardrail 10: no plugin loading,
 * no dynamic registration at runtime). Designs register themselves here at
 * import time; the host reads the registry. Type erasure to
 * `LabDesignDefinition<object>` is localized to this boundary, mirroring the
 * production registry dispatch.
 */
import type { LabDesignDefinition } from '../contracts'

const definitions = new Map<string, LabDesignDefinition>()

type RegistryGlobals = {
  __loreforgeLabRegistryOverride?: Map<string, LabDesignDefinition>
}

const registryGlobals = globalThis as unknown as RegistryGlobals

export function registerDesign<TConfig extends object>(definition: LabDesignDefinition<TConfig>): void {
  if (definitions.has(definition.key)) {
    throw new Error(`Duplicate Design key: ${definition.key}`)
  }
  if (definition.status !== 'first-class') {
    throw new Error(`Design "${definition.key}" must declare status 'first-class' in the Lab`)
  }
  definitions.set(definition.key, definition as unknown as LabDesignDefinition)
  registryGlobals.__loreforgeLabRegistryOverride = definitions
}

export function getDesignDefinitions(): LabDesignDefinition[] {
  return [...definitions.values()]
}

export function getDesignDefinition(key: string): LabDesignDefinition | undefined {
  return definitions.get(key)
}

/** Test helper — clears all registered Designs. */
export function clearRegistry(): void {
  definitions.clear()
  registryGlobals.__loreforgeLabRegistryOverride = definitions
}

// Registered Designs live in sibling folders and import this registry:
//   contract-probe (legacy compatibility). The _template is never
//   registered — it is a copy source only.
export { registerDesign as register }
