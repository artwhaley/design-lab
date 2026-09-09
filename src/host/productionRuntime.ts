import type { DesignDefinition } from '@/lib/design/types'
import type { BaseDesignTheme, ResolvedDesignTheme } from '../contracts'

export type ProductionRuntime<TConfig extends object = object> = {
  config: TConfig
  theme: ResolvedDesignTheme
  cssVars: Record<string, string>
}

const baseVars: Record<keyof BaseDesignTheme, string> = {
  primary: '--tenant-primary',
  secondary: '--tenant-secondary',
  accent: '--tenant-accent',
  pageBg: '--tenant-page-bg',
  surfaceBg: '--tenant-surface-bg',
  surfaceBorder: '--tenant-surface-border',
  textOnPrimary: '--tenant-text-on-primary',
  headingFont: '--tenant-heading-font',
  bodyFont: '--tenant-body-font',
  mutedText: '--tenant-muted-text',
}

export function resolveProductionRuntime<TConfig extends object>(
  design: DesignDefinition<TConfig>,
  rawConfig: unknown,
  persistedVersion: number | null,
): { runtime: ProductionRuntime<TConfig>; errors: string[] } {
  let candidate = rawConfig
  if (persistedVersion !== null && persistedVersion !== design.config.version) {
    const migrated = design.config.migrate(persistedVersion, rawConfig)
    if (!migrated.ok) return { runtime: defaultsRuntime(design), errors: migrated.errors }
    candidate = migrated.value
  }
  const validated = design.config.validate(candidate)
  if (!validated.ok) return { runtime: defaultsRuntime(design), errors: validated.errors }
  return { runtime: runtimeFromConfig(design, validated.value), errors: [] }
}

function defaultsRuntime<TConfig extends object>(design: DesignDefinition<TConfig>): ProductionRuntime<TConfig> {
  return runtimeFromConfig(design, design.config.defaults)
}

function runtimeFromConfig<TConfig extends object>(design: DesignDefinition<TConfig>, config: TConfig): ProductionRuntime<TConfig> {
  const theme = design.config.resolveTheme(config)
  const cssVars: Record<string, string> = {}
  for (const [key, variable] of Object.entries(baseVars)) {
    cssVars[variable] = theme.base[key as keyof typeof theme.base] ?? ''
  }
  Object.assign(cssVars, theme.vars ?? {})
  return { config, theme: { base: theme.base, vars: theme.vars ?? {} }, cssVars }
}