/**
 * Obsidian config contract — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 and adapted to the Lab
 * DesignConfigContract: strict validate, migrate, and a theme resolver that
 * emits the universal base tokens (--tenant-*) plus the Obsidian-owned vars
 * (--obsidian-*) the module CSS consumes.
 */
import type { DesignConfigContract, ResolvedDesignTheme } from '../../contracts'

export type ObsidianConfig = {
  palette: {
    background: string
    surface: string
    text: string
    muted: string
    accent: string
  }
  geometry: { contentMax: number; pageGutter: number; surfaceRadius: number }
  records: {
    defaultView: 'cards' | 'list'
    cardPageSize: 6 | 12 | 24
    listPageSize: 25 | 50 | 100
  }
  atmosphereImage: string | null
}

export const OBSIDIAN_DEFAULTS: ObsidianConfig = {
  palette: {
    background: '#0b1419',
    surface: '#142128',
    text: '#edf2ef',
    muted: '#a7b7bc',
    accent: '#bce6d3',
  },
  geometry: { contentMax: 1440, pageGutter: 56, surfaceRadius: 18 },
  records: { defaultView: 'cards', cardPageSize: 6, listPageSize: 50 },
  // Lab-local authorized media reference (DesignAssetRef rule: /media/...).
  atmosphereImage: '/media/lab-fixtures/obsidian-coastline.png',
}

const HEX = /^#[0-9a-fA-F]{6}$/
const POSITIVE = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

export const obsidianConfig: DesignConfigContract<ObsidianConfig> = {
  version: 1,
  defaults: OBSIDIAN_DEFAULTS,

  validate(raw: unknown) {
    if (raw === null || typeof raw !== 'object') return { ok: false, errors: ['Config must be an object.'] }
    const value = raw as Record<string, unknown>
    const errors: string[] = []
    const palette = value.palette as Record<string, unknown> | undefined
    const geometry = value.geometry as Record<string, unknown> | undefined
    const records = value.records as Record<string, unknown> | undefined
    if (!palette || typeof palette !== 'object') errors.push('palette is required.')
    else {
      for (const key of ['background', 'surface', 'text', 'muted', 'accent'] as const) {
        if (typeof palette[key] !== 'string' || !HEX.test(palette[key] as string)) errors.push(`palette.${key} must be a 6-digit hex color.`)
      }
    }
    if (!geometry || typeof geometry !== 'object') errors.push('geometry is required.')
    else {
      if (!POSITIVE(geometry.contentMax)) errors.push('geometry.contentMax must be a positive number.')
      if (!POSITIVE(geometry.pageGutter)) errors.push('geometry.pageGutter must be a positive number.')
      if (!POSITIVE(geometry.surfaceRadius)) errors.push('geometry.surfaceRadius must be a positive number.')
    }
    if (!records || typeof records !== 'object') errors.push('records is required.')
    else {
      if (records.defaultView !== 'cards' && records.defaultView !== 'list') errors.push('records.defaultView must be "cards" or "list".')
      if (![6, 12, 24].includes(records.cardPageSize as number)) errors.push('records.cardPageSize must be 6, 12, or 24.')
      if (![25, 50, 100].includes(records.listPageSize as number)) errors.push('records.listPageSize must be 25, 50, or 100.')
    }
    if (value.atmosphereImage !== null && typeof value.atmosphereImage !== 'string') errors.push('atmosphereImage must be a string or null.')
    if (errors.length > 0) return { ok: false, errors }
    return {
      ok: true,
      value: {
        palette: { background: palette!.background as string, surface: palette!.surface as string, text: palette!.text as string, muted: palette!.muted as string, accent: palette!.accent as string },
        geometry: { contentMax: geometry!.contentMax as number, pageGutter: geometry!.pageGutter as number, surfaceRadius: geometry!.surfaceRadius as number },
        records: { defaultView: records!.defaultView as ObsidianConfig['records']['defaultView'], cardPageSize: records!.cardPageSize as 6 | 12 | 24, listPageSize: records!.listPageSize as 25 | 50 | 100 },
        atmosphereImage: value.atmosphereImage as string | null,
      },
    }
  },

  migrate(fromVersion: number, raw: unknown) {
    if (fromVersion === 1) return obsidianConfig.validate(raw)
    return { ok: false, errors: [`Unsupported config version ${fromVersion}.`] }
  },

  resolveTheme(config: ObsidianConfig): ResolvedDesignTheme {
    return {
      base: {
        primary: config.palette.surface,
        secondary: config.palette.background,
        accent: config.palette.accent,
        pageBg: config.palette.background,
        surfaceBg: config.palette.surface,
        surfaceBorder: '#26353c',
        textOnPrimary: config.palette.text,
        headingFont: '"Manrope Variable", Manrope, "Avenir Next", "Segoe UI", sans-serif',
        bodyFont: '"Manrope Variable", Manrope, "Avenir Next", "Segoe UI", sans-serif',
        mutedText: config.palette.muted,
      },
      vars: {
        '--obsidian-bg': config.palette.background,
        '--obsidian-surface': config.palette.surface,
        '--obsidian-text': config.palette.text,
        '--obsidian-muted': config.palette.muted,
        '--obsidian-accent': config.palette.accent,
        '--obsidian-max': `${config.geometry.contentMax}px`,
        '--obsidian-gutter': `${config.geometry.pageGutter}px`,
        '--obsidian-radius': `${config.geometry.surfaceRadius}px`,
      },
    }
  },
}