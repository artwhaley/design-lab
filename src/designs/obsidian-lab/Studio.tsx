/**
 * Obsidian Studio editor — edits the Design config through onChange only;
 * the host validates on save. The atmosphere image is uploaded through the
 * supplied uploadAsset helper (DesignAssetRef rule).
 */
import type { LabStudioEditorProps } from '../../contracts'
import type { ObsidianConfig } from './config'

export function ObsidianStudioEditor({ value, onChange, domain, uploadAsset }: LabStudioEditorProps<ObsidianConfig>) {
  const setPalette = (key: keyof ObsidianConfig['palette'], next: string) =>
    onChange({ ...value, palette: { ...value.palette, [key]: next } })
  const setGeometry = (key: keyof ObsidianConfig['geometry'], next: number) =>
    onChange({ ...value, geometry: { ...value.geometry, [key]: next } })

  return (
    <div className="obsidian-studio">
      <h3>Obsidian settings</h3>
      <p className="obsidian-studio-hint">Domain: {domain.name} · {domain.motto || 'no motto'}</p>

      <fieldset>
        <legend>Palette</legend>
        {(['background', 'surface', 'text', 'muted', 'accent'] as const).map((key) => (
          <label key={key} className="obsidian-studio-row">
            <span>{key}</span>
            <input type="color" value={value.palette[key]} onChange={(e) => setPalette(key, e.target.value)} />
            <input
              type="text"
              value={value.palette[key]}
              aria-label={`${key} (hex)`}
              onChange={(e) => setPalette(key, e.target.value)}
            />
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Geometry</legend>
        <label className="obsidian-studio-row">
          <span>Content max (px)</span>
          <input
            type="number"
            value={value.geometry.contentMax}
            onChange={(e) => setGeometry('contentMax', Number(e.target.value))}
          />
        </label>
        <label className="obsidian-studio-row">
          <span>Page gutter (px)</span>
          <input
            type="number"
            value={value.geometry.pageGutter}
            onChange={(e) => setGeometry('pageGutter', Number(e.target.value))}
          />
        </label>
        <label className="obsidian-studio-row">
          <span>Surface radius (px)</span>
          <input
            type="number"
            value={value.geometry.surfaceRadius}
            onChange={(e) => setGeometry('surfaceRadius', Number(e.target.value))}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Records</legend>
        <label className="obsidian-studio-row">
          <span>Default view</span>
          <select value={value.records.defaultView} onChange={(e) => onChange({ ...value, records: { ...value.records, defaultView: e.target.value as 'cards' | 'list' } })}>
            <option value="cards">Cards</option>
            <option value="list">List</option>
          </select>
        </label>
        <label className="obsidian-studio-row">
          <span>Cards per page</span>
          <select value={value.records.cardPageSize} onChange={(e) => onChange({ ...value, records: { ...value.records, cardPageSize: Number(e.target.value) as 6 | 12 | 24 } })}>
            {[6, 12, 24].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="obsidian-studio-row">
          <span>Rows per page</span>
          <select value={value.records.listPageSize} onChange={(e) => onChange({ ...value, records: { ...value.records, listPageSize: Number(e.target.value) as 25 | 50 | 100 } })}>
            {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Atmosphere image</legend>
        <label className="obsidian-studio-row">
          <span>Image URL</span>
          <input
            type="text"
            value={value.atmosphereImage ?? ''}
            placeholder="/media/…"
            onChange={(e) => onChange({ ...value, atmosphereImage: e.target.value || null })}
          />
        </label>
        <label className="obsidian-studio-row">
          <span>Upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                const ref = await uploadAsset(file, 'atmosphere')
                onChange({ ...value, atmosphereImage: ref.url })
              }
            }}
          />
        </label>
      </fieldset>
    </div>
  )
}