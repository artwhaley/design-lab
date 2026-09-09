/**
 * Contract Probe config — intentionally tiny (one density axis, one accent,
 * debug toggle) but strictly validated. This Design is executable
 * documentation, not an aesthetic statement (A12).
 *
 * The config contract is the production `DesignDefinition["config"]` shape
 * exactly: version, defaults, validate, migrate, resolveTheme. No Lab-only
 * type is imported; the literal is checked structurally when it is assigned
 * to `DesignDefinition` in `index.ts`.
 */
import type { ValidationResult } from "@/lib/design/contracts"

export type ProbeConfigV1 = {
  density: 'comfortable' | 'compact'
  accent: string
  showDebugIds: boolean
}

export const PROBE_DEFAULTS: ProbeConfigV1 = {
  density: 'comfortable',
  accent: '#336699',
  showDebugIds: false,
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export const probeConfig = {
  version: 1,
  defaults: PROBE_DEFAULTS,

  validate(raw: unknown): ValidationResult<ProbeConfigV1> {
    if (raw === null || typeof raw !== 'object') {
      return { ok: false, errors: ['Config must be an object.'] }
    }
    const value = raw as Record<string, unknown>
    const errors: string[] = []
    if (value.density !== 'comfortable' && value.density !== 'compact') errors.push('density must be "comfortable" or "compact".')
    if (typeof value.accent !== 'string' || !HEX_COLOR.test(value.accent)) errors.push('accent must be a 6-digit hex color (#rrggbb).')
    if (typeof value.showDebugIds !== 'boolean') errors.push('showDebugIds must be a boolean.')
    if (errors.length > 0) return { ok: false, errors }
    return {
      ok: true,
      value: {
        density: value.density as ProbeConfigV1['density'],
        accent: value.accent as string,
        showDebugIds: value.showDebugIds as boolean,
      },
    }
  },

  migrate(fromVersion: number, raw: unknown): ValidationResult<ProbeConfigV1> {
    if (fromVersion === 1) return probeConfig.validate(raw)
    return { ok: false, errors: [`Unsupported config version ${fromVersion}.`] }
  },

  resolveTheme(config: ProbeConfigV1): {
    base: {
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
    vars?: Record<string, string>
  } {
    const muted = '#5c6670'
    return {
      base: {
        primary: '#22303c',
        secondary: '#3d5a73',
        accent: config.accent,
        pageBg: '#f7f8fa',
        surfaceBg: '#ffffff',
        surfaceBorder: '#d8dde3',
        textOnPrimary: '#ffffff',
        headingFont: 'Georgia, "Times New Roman", serif',
        bodyFont: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
        mutedText: muted,
      },
      vars: {
        '--probe-density': config.density === 'compact' ? '0.78' : '1',
        '--probe-muted': muted,
        '--probe-accent': config.accent,
      },
    }
  },
}