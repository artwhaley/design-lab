/**
 * <Name> config contract — template skeleton.
 *
 * A Design config holds ONLY author-controlled presentation options. It is
 * strictly validated (Bible §8): the host migrates → validates → resolves the
 * theme, and the preview renderer never sees raw persisted input.
 *
 * Add your own axes here (e.g. `layout: 'cards' | 'table'`). Keep defaults
 * deterministic and validation messages actionable for the Studio panel.
 */
import type { DesignConfigContract, ResolvedDesignTheme } from '../../contracts'

export type TemplateConfigV1 = {
  /** Demo axis — replace with your Design's real options. */
  accent: string
}

export const TEMPLATE_DEFAULTS: TemplateConfigV1 = {
  accent: '#336699',
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export const templateConfig: DesignConfigContract<TemplateConfigV1> = {
  version: 1,
  defaults: TEMPLATE_DEFAULTS,

  validate(raw: unknown) {
    if (raw === null || typeof raw !== 'object') {
      return { ok: false, errors: ['Config must be an object.'] }
    }
    const value = raw as Record<string, unknown>
    const errors: string[] = []
    if (typeof value.accent !== 'string' || !HEX_COLOR.test(value.accent)) errors.push('accent must be a 6-digit hex color (#rrggbb).')
    if (errors.length > 0) return { ok: false, errors }
    return { ok: true, value: { accent: value.accent as string } }
  },

  migrate(fromVersion: number, raw: unknown) {
    // Future config versions: map fromVersion N → N+1 here, then validate.
    if (fromVersion === 1) return templateConfig.validate(raw)
    return { ok: false, errors: [`Unsupported config version ${fromVersion}.`] }
  },

  resolveTheme(config: TemplateConfigV1): ResolvedDesignTheme {
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
        mutedText: '#5c6670',
      },
      vars: {
        // Design-owned CSS variables — names must start with `--<design>`.
        '--template-accent': config.accent,
      },
    }
  },
}