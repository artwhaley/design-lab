/**
 * Contract Probe Studio editor — edits the three config fields through the
 * supplied `onChange`; the host validates + persists on save. Typed against
 * the production `DesignStudioEditorProps` contract, not a Lab-only type.
 */
import type { DesignStudioEditorProps } from '@/lib/design/contracts'
import type { ProbeConfigV1 } from './config'

export function ProbeStudioEditor({ value, onChange, domain }: DesignStudioEditorProps<ProbeConfigV1>) {
  return (
    <div className="probe-studio">
      <h3>Contract Probe settings</h3>
      <p className="probe-hint">
        This Design is executable documentation. These three fields exercise the
        config → validation → theme pipeline end to end.
      </p>
      <label className="probe-field">
        <span className="probe-label">Density</span>
        <select
          value={value.density}
          onChange={(e) => onChange({ ...value, density: e.target.value as ProbeConfigV1['density'] })}
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label className="probe-field">
        <span className="probe-label">Accent color</span>
        <input
          type="color"
          value={value.accent}
          onChange={(e) => onChange({ ...value, accent: e.target.value })}
        />
        <input
          type="text"
          value={value.accent}
          aria-label="Accent color (hex)"
          onChange={(e) => onChange({ ...value, accent: e.target.value })}
        />
      </label>
      <label className="probe-field">
        <span className="probe-label">Show debug IDs</span>
        <input
          type="checkbox"
          checked={value.showDebugIds}
          onChange={(e) => onChange({ ...value, showDebugIds: e.target.checked })}
        />
      </label>
      <div className="probe-hint">
        Domain: {domain.name} · {domain.motto || 'no motto'} · logo {domain.logoUrl ? 'set' : 'not set'}
      </div>
    </div>
  )
}