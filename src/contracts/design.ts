/**
 * Host-level design machinery the Lab emulates: validation, config/theme
 * contracts, runtime shape, and the host's route context. Pure types — no
 * Payload, no Next, no Node imports (A03).
 *
 * The DESIGN-FACING contract is `DesignDefinition` in `@/lib/design/types`
 * (byte-identical to production). Nothing here is required by a Design
 * folder; these are host-internal utilities only.
 */
import type { SurfaceKey } from './surfaces'

// ---------------------------------------------------------------------------
// Validation, assets, theme
// ---------------------------------------------------------------------------

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

/** A local authorized media reference only: /media/... URLs. */
export type DesignAssetRef = {
  url: string
}

export const MEDIA_REF_RE = /^\/media\//

export type BaseDesignTheme = {
  primary: string
  secondary: string
  accent: string
  pageBg: string
  surfaceBg: string
  surfaceBorder: string
  textOnPrimary: string
  headingFont: string
  bodyFont: string
  mutedText: string
}

/** Universal base token -> CSS variable mapping (Bible §12). */
export const BASE_THEME_VARS: Record<keyof BaseDesignTheme, string> = {
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

/**
 * A Design resolves its validated config into the universal base tokens plus
 * unlimited Design-owned vars (`--my-design-*`). Design-owned vars are used
 * verbatim as CSS custom-property names.
 */
export type ResolvedDesignTheme = {
  base: BaseDesignTheme
  vars: Record<string, string>
}

/** Assemble the full CSS custom-property map applied at the preview root. */
export function resolveCssVars(theme: ResolvedDesignTheme): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(BASE_THEME_VARS) as Array<keyof BaseDesignTheme>) {
    out[BASE_THEME_VARS[key]] = theme.base[key]
  }
  return { ...out, ...theme.vars }
}

// ---------------------------------------------------------------------------
// Config contract
// ---------------------------------------------------------------------------

export type DesignConfigContract<TConfig extends object> = {
  version: number
  defaults: TConfig
  validate(raw: unknown): ValidationResult<TConfig>
  migrate(fromVersion: number, raw: unknown): ValidationResult<TConfig>
  resolveTheme(config: TConfig): ResolvedDesignTheme
}

// ---------------------------------------------------------------------------
// Runtime delivered to every surface
// ---------------------------------------------------------------------------

export type DesignRuntime<TConfig extends object> = {
  /** Validated config — never raw persisted input (Bible §8). */
  config: TConfig
  theme: ResolvedDesignTheme
  cssVars: Record<string, string>
}

// ---------------------------------------------------------------------------
// Host route context
// ---------------------------------------------------------------------------

export type LabRouteContext = {
  surface: SurfaceKey
  canonicalPath: string
  activeNavigationSegment: string | null
  viaCompat?: 'review' | 'subdomains'
}

