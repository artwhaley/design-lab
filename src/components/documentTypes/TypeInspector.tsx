import type { TypeTreeLeaf } from '@/lib/documents/typeTree'

type Props = {
  mode: 'create' | 'edit'
  domainSlug: string
  leaf: TypeTreeLeaf | null
  departments: Array<{ id: number; name: string; archived: boolean }>
  typeFolders: unknown[]
  roles: unknown[]
  folders: unknown[]
  stages: unknown
  defaultDepartmentId: number | null
  onCreated: (id: number) => void
  onDuplicate: (id: number) => void
  onCancel?: () => void
}

export function TypeInspector(props: Props) {
  return <section aria-label="Document type inspector" style={{ padding: 18, display: 'grid', gap: 12 }}>
    <h2>{props.mode === 'create' ? 'New document type' : props.leaf?.name ?? 'Document type'}</h2>
    <p>Design Lab type inspector shim. The production contract and host action boundary are active.</p>
    {props.mode === 'create' ? <button type="button" onClick={() => props.onCreated(0)}>Create type</button> : null}
    {props.onCancel ? <button type="button" onClick={props.onCancel}>Cancel</button> : null}
  </section>
}
