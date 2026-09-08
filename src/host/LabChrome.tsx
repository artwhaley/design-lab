/**
 * LabChrome — the utilitarian toolbar above the preview (A19). Extended in
 * T07 (scenario controls) and T09 (viewport + compare). All controls are
 * labeled for keyboard/AT use.
 */
import type { LabDesignDefinition } from '../contracts'
import type { SurfaceDescriptor } from '../contracts'

export type ViewportPreset = { width: number; height: number; label: string }

export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  { width: 320, height: 700, label: 'Phone narrow' },
  { width: 390, height: 800, label: 'Phone wide' },
  { width: 768, height: 900, label: 'Tablet' },
  { width: 1280, height: 900, label: 'Desktop' },
  { width: 1600, height: 1000, label: 'Wide desktop' },
]

export type { ViewportPreset as ViewportPresetType }

type Props = {
  designs: LabDesignDefinition[]
  designKey: string
  compareKey: string | null
  onDesignChange(key: string): void
  onCompareChange(key: string | null): void
  surface: SurfaceDescriptor
  compareEnabled: boolean
  onToggleCompare(): void
  onReset(): void
  onRunDiagnostics(): void
  routeNote: string | null
}

export function LabChrome(props: Props) {
  const {
    designs, designKey, compareKey, onDesignChange, onCompareChange,
    surface, compareEnabled, onToggleCompare,
    onReset, onRunDiagnostics, routeNote,
  } = props

  return (
    <header className="lab-toolbar">
      <h1>
        LoreForge Design Lab
        <small>contract v2026-09-management-v1</small>
      </h1>

      <div className="lab-control-group">
        <label htmlFor="lab-design-select">Design</label>
        <select id="lab-design-select" value={designKey} onChange={(e) => onDesignChange(e.target.value)}>
          {designs.map((design) => (
            <option key={design.key} value={design.key}>{design.name}</option>
          ))}
        </select>
      </div>

      {compareEnabled && (
        <div className="lab-control-group">
          <label htmlFor="lab-compare-select">Compare</label>
          <select id="lab-compare-select" value={compareKey ?? ''} onChange={(e) => onCompareChange(e.target.value || null)}>
            <option value="">— off —</option>
            {designs.filter((d) => d.key !== designKey).map((design) => (
              <option key={design.key} value={design.key}>{design.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="lab-control-group">
        <span className="lab-hint" aria-label="active surface">
          Surface: <strong>{surface.label}</strong>
          {routeNote ? <span className="lab-hint"> ({routeNote})</span> : null}
        </span>
      </div>

      <div className="lab-actions" style={{ marginLeft: 'auto' }}>
        <button type="button" className="lab-button" onClick={onToggleCompare}>
          {compareEnabled && compareKey ? 'Close compare' : 'Compare'}
        </button>
        <button type="button" className="lab-button" onClick={onRunDiagnostics}>Diagnostics</button>
        <button type="button" className="lab-button lab-danger" onClick={onReset}>Reset</button>
      </div>
    </header>
  )
}