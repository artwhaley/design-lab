/**
 * <Name> Studio editor — template skeleton.
 *
 * Receives the current config draft, an onChange to update it (the host
 * validates on save), and domain facts. Do NOT validate here; the host
 * validates persisted input. Add controls for your config axes.
 */
import type { LabStudioEditorProps } from '../../contracts'
import type { TemplateConfigV1 } from './config'

export function TemplateStudioEditor({ value, onChange, domain }: LabStudioEditorProps<TemplateConfigV1>) {
  return (
    <div className="template-studio">
      <h3>{'<Name> settings'}</h3>
      <label>
        Accent color
        <input
          type="color"
          value={value.accent}
          onChange={(e) => onChange({ ...value, accent: e.target.value })}
        />
      </label>
      <p className="template-stub-hint">
        Domain: {domain.name} · {domain.motto || 'no motto'} · logo {domain.logoUrl ? 'set' : 'not set'}
      </p>
    </div>
  )
}