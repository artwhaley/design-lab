/**
 * StudioPanel — emulates the production Design customization lifecycle
 * (Bible §36/§37): draft config -> Design-owned Studio editor -> live preview
 * -> Save -> per-Design saved bank. The host owns Save/Revert/Defaults/dirty/
 * validation; the Design owns the editor itself.
 */
import type { DesignAssetRef, LabDesignDefinition } from '../contracts'

type Props<TConfig extends object> = {
  design: LabDesignDefinition<TConfig>
  draft: unknown
  savedVersion: number | null
  dirty: boolean
  validationErrors: string[]
  domain: { name: string; motto: string; logoUrl: string | null }
  uploadAsset(file: File, purpose: string): Promise<DesignAssetRef>
  onChange(next: unknown): void
  onSave(): void
  onRevert(): void
  onRestoreDefaults(): void
}

export function StudioPanel<TConfig extends object>({ design, draft, savedVersion, dirty, validationErrors, domain, uploadAsset, onChange, onSave, onRevert, onRestoreDefaults }: Props<TConfig>) {
  const Editor = design.studio.Editor
  return (
    <div>
      <h3>Studio — {design.name}</h3>
      <p className="lab-hint">
        Editing <code>{design.key}</code> · config v{design.config.version}
        {savedVersion !== null ? ` · bank v${savedVersion}` : ' · no saved bank yet'}
      </p>

      <div className="lab-row" style={{ margin: '6px 0' }}>
        <span className={`lab-status ${dirty ? 'lab-status-dirty' : 'lab-status-ok'}`}>{dirty ? 'unsaved changes' : 'saved'}</span>
      </div>

      <Editor
        value={draft as never}
        onChange={(next) => onChange(next)}
        domain={domain}
        uploadAsset={uploadAsset}
      />

      {validationErrors.length > 0 ? (
        <div role="alert" style={{ marginTop: 10 }}>
          <p className="lab-error-text">Validation errors — draft is not saved:</p>
          <ul className="lab-error-text" style={{ margin: 4, paddingLeft: 18 }}>
            {validationErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="lab-actions">
        <button type="button" className="lab-button lab-primary" onClick={onSave} disabled={validationErrors.length > 0}>Save</button>
        <button type="button" className="lab-button" onClick={onRevert} disabled={!dirty}>Revert</button>
        <button type="button" className="lab-button" onClick={onRestoreDefaults}>Restore defaults</button>
      </div>
    </div>
  )
}