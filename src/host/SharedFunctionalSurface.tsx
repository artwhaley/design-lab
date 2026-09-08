/**
 * SharedFunctionalSurface — Class B placeholder bodies (A10). These are NOT
 * editors: they exist to prove Shell geometry, theme compatibility,
 * navigation, overflow, and visual coexistence. They are deliberately generic
 * and must never become reusable production editor code.
 */
import type { ReactNode } from 'react'
import type { ClassBSurfaceKey } from '../contracts'

type Props = {
  surface: ClassBSurfaceKey
  baseUrl: string
}

function PlaceholderShell(props: { title: string; children: ReactNode }) {
  return (
    <div style={{ padding: '24px 32px', fontFamily: 'var(--tenant-body-font, Georgia, serif)', color: 'var(--tenant-text, inherit)' }}>
      <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tenant-muted-text, #888)' }}>
        Shared functional surface · placeholder
      </p>
      <h2 style={{ fontFamily: 'var(--tenant-heading-font, Georgia, serif)', margin: '4px 0 16px' }}>{props.title}</h2>
      {props.children}
    </div>
  )
}

const field = (label: string) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
    <label style={{ fontSize: 12, color: 'var(--tenant-muted-text, #888)' }}>{label}</label>
    <div style={{ height: 34, border: '1px solid var(--tenant-surface-border, #ddd)', borderRadius: 4, background: 'var(--tenant-surface-bg, #fff)' }} />
  </div>
)

const toolbar = (
  <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
    {['Save', 'Preview', 'Insert', 'Format'].map((label) => (
      <span key={label} style={{ padding: '6px 14px', border: '1px solid var(--tenant-surface-border, #ddd)', borderRadius: 4, background: 'var(--tenant-surface-bg, #fff)', fontSize: 13 }}>{label}</span>
    ))}
  </div>
)

function contentRegion() {
  return (
    <div style={{ border: '1px solid var(--tenant-surface-border, #ddd)', borderRadius: 6, background: 'var(--tenant-surface-bg, #fff)', minHeight: 240, padding: 16, marginTop: 12 }}>
      <p style={{ color: 'var(--tenant-muted-text, #888)', fontSize: 13 }}>
        Shared tool content region. This is a deliberate placeholder so the Design Shell can be checked for theme
        compatibility, spacing, overflow, and coexistence with shared editor geometry.
      </p>
    </div>
  )
}

export function SharedFunctionalSurface({ surface, baseUrl }: Props) {
  switch (surface) {
    case 'shared.forms':
      return (
        <PlaceholderShell title="Forms — list / builder / fill">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{field('Form name')}{field('Template')}{field('Visibility')}</div>
          {toolbar}
          {contentRegion()}
          <p className="lab-hint" style={{ marginTop: 8 }}>Route family: {baseUrl}/forms · shared form engine placeholder</p>
        </PlaceholderShell>
      )
    case 'shared.templates':
      return (
        <PlaceholderShell title="Markdown Templates — list / editor / new">
          {toolbar}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 220, border: '1px solid var(--tenant-surface-border, #ddd)', borderRadius: 6, padding: 8 }}>
              {['Survey Report', 'Expedition Log', 'Census Ledger', 'Field Notes'].map((t) => (
                <div key={t} style={{ padding: '6px 8px', borderRadius: 4, background: 'var(--tenant-surface-bg, #fff)', marginBottom: 4, fontSize: 13 }}>{t}</div>
              ))}
            </div>
            <div style={{ flex: 1 }}>{contentRegion()}</div>
          </div>
        </PlaceholderShell>
      )
    case 'shared.import':
      return (
        <PlaceholderShell title="Markdown Import">
          <div style={{ border: '2px dashed var(--tenant-surface-border, #ddd)', borderRadius: 8, padding: 40, textAlign: 'center', color: 'var(--tenant-muted-text, #888)' }}>
            Drop documents here or browse files — upload/drop area placeholder
          </div>
          {contentRegion()}
        </PlaceholderShell>
      )
    case 'shared.documentEdit':
      return (
        <PlaceholderShell title="Document editor">
          {toolbar}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>{contentRegion()}</div>
            <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {field('Status')}{field('Folder')}{field('Type')}
            </div>
          </div>
        </PlaceholderShell>
      )
    case 'shared.documentHistory':
      return (
        <PlaceholderShell title="Document history">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['2026-02-21 · Public History: Centennial Preparations (Submitted Draft)', '2026-01-22 · Expedition Photos — First Crossing of the Tangle (Re-digitized)', '2025-12-04 · Council Session Minutes'].map((row) => (
              <div key={row} style={{ padding: '8px 12px', border: '1px solid var(--tenant-surface-border, #ddd)', borderRadius: 4, fontSize: 13 }}>{row}</div>
            ))}
          </div>
        </PlaceholderShell>
      )
    case 'shared.pageEdit':
      return (
        <PlaceholderShell title="Informational page editor">
          <div style={{ display: 'flex', gap: 12 }}>{field('Page title')}{field('Slug')}</div>
          {toolbar}
          {contentRegion()}
        </PlaceholderShell>
      )
    case 'shared.siteStudio':
      return (
        <PlaceholderShell title="Site Studio host">
          <p style={{ color: 'var(--tenant-muted-text, #888)' }}>
            In production this is the shared Site Studio host that dispatches the selected Design's Studio editor.
            The Lab's Studio panel (right side) is the emulator of this surface.
          </p>
          {contentRegion()}
        </PlaceholderShell>
      )
  }
}