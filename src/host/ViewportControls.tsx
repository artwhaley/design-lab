/**
 * ViewportControls — named preview widths plus an optional custom
 * width/height entry (T09). The preview container scrolls independently of
 * the Lab chrome.
 */
import { useState } from 'react'
import { VIEWPORT_PRESETS } from './LabChrome'
import type { Viewport } from './PreviewPane'

type Props = {
  viewport: Viewport | null
  onChange(viewport: Viewport | null): void
}

export function ViewportControls({ viewport, onChange }: Props) {
  const [customWidth, setCustomWidth] = useState('1024')
  const [customHeight, setCustomHeight] = useState('800')

  const applyCustom = (): void => {
    const width = Math.max(200, Math.min(4000, Number(customWidth) || 1024))
    const height = Math.max(200, Math.min(4000, Number(customHeight) || 800))
    onChange({ width, height, label: 'Custom' })
  }

  return (
    <div>
      <label htmlFor="lab-viewport-preset">Viewport preset</label>
      <select
        id="lab-viewport-preset"
        value={viewport?.label ?? 'Fluid'}
        onChange={(e) => {
          const label = e.target.value
          if (label === 'Fluid') {
            onChange(null)
            return
          }
          const preset = VIEWPORT_PRESETS.find((p) => p.label === label)
          if (preset) onChange({ width: preset.width, height: preset.height, label: preset.label })
        }}
      >
        <option value="Fluid">Fluid</option>
        {VIEWPORT_PRESETS.map((preset) => (
          <option key={preset.label} value={preset.label}>{preset.label}</option>
        ))}
        {viewport?.label === 'Custom' ? <option value="Custom">Custom</option> : null}
      </select>

      <label htmlFor="lab-viewport-width">Custom width (px)</label>
      <div className="lab-row">
        <input id="lab-viewport-width" type="number" min={200} max={4000} value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} />
        <span className="lab-hint">×</span>
        <input id="lab-viewport-height" aria-label="Custom height (px)" type="number" min={200} max={4000} value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} />
        <button type="button" className="lab-button" onClick={applyCustom}>Apply</button>
      </div>
      <p className="lab-hint">Preview scrolls independently of Lab chrome.</p>
    </div>
  )
}