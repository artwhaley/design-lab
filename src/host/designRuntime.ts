/**
 * Design runtime resolution (Bible §8): saved/selected config -> migration ->
 * validation -> defaults/fallback -> theme resolution -> renderer runtime.
 * The preview renderer never sees raw persisted config.
 */
import type { DesignRuntime, LabDesignDefinition, ResolvedDesignTheme } from '../contracts'
import { resolveCssVars } from '../contracts'

export type RuntimeResolution<TConfig extends object> = {
  runtime: DesignRuntime<TConfig>
  errors: string[]
}

export function resolveDesignRuntime<TConfig extends object>(
  design: LabDesignDefinition<TConfig>,
  rawConfig: unknown,
  persistedVersion: number | null,
): RuntimeResolution<TConfig> {
  // Migration path when a persisted version predates the current config.
  let candidate = rawConfig
  if (persistedVersion !== null && persistedVersion !== design.config.version) {
    const migrated = design.config.migrate(persistedVersion, rawConfig)
    if (migrated.ok) candidate = migrated.value
    else return { runtime: defaultsRuntime(design), errors: migrated.errors }
  }

  const validated = design.config.validate(candidate)
  if (!validated.ok) {
    return { runtime: defaultsRuntime(design), errors: validated.errors }
  }

  const theme: ResolvedDesignTheme = design.config.resolveTheme(validated.value)
  return {
    runtime: {
      config: validated.value,
      theme,
      cssVars: resolveCssVars(theme),
    },
    errors: [],
  }
}

function defaultsRuntime<TConfig extends object>(design: LabDesignDefinition<TConfig>): DesignRuntime<TConfig> {
  const theme = design.config.resolveTheme(design.config.defaults)
  return {
    config: design.config.defaults,
    theme,
    cssVars: resolveCssVars(theme),
  }
}