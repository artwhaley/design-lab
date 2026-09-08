import type { DocumentTypeTemplateMode } from '../contracts'

/** Document Type source entity. Preserves Department-root / manual folder / actual type distinctions. */
export type DocumentTypeEntity = {
  id: number
  name: string
  /** Department root this type lives under (null => Unassigned virtual grouping). */
  departmentRootId: number | null
  /** Manual grouping folder id within the department root, when applicable. */
  parentFolderId: number | null
  templateMode: DocumentTypeTemplateMode
  archived: boolean
  lifecycleStages: string[]
}

export const DOCUMENT_TYPES: readonly DocumentTypeEntity[] = [
  { id: 1, name: 'Directive', departmentRootId: 1, parentFolderId: null, templateMode: 'blank', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
  { id: 2, name: 'Census Ledger', departmentRootId: 3, parentFolderId: null, templateMode: 'form-to-markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
  { id: 3, name: 'Land Grant', departmentRootId: 3, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed', 'Superseded'] },
  { id: 4, name: 'Trade Accord', departmentRootId: 3, parentFolderId: null, templateMode: 'form-to-markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
  { id: 5, name: 'Survey Report', departmentRootId: 2, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed', 'Deprecated'] },
  { id: 6, name: 'Expedition Log', departmentRootId: 4, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
  { id: 7, name: 'Xenological Dossier', departmentRootId: 5, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed', 'Deprecated'] },
  { id: 8, name: 'Personnel Record', departmentRootId: 1, parentFolderId: null, templateMode: 'form-to-markdown', archived: false, lifecycleStages: ['Draft', 'Filed'] },
  { id: 9, name: 'Field Notes', departmentRootId: 4, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Filed'] },
  { id: 10, name: 'Obsolete Charter', departmentRootId: 1, parentFolderId: null, templateMode: 'blank', archived: true, lifecycleStages: ['Draft', 'Filed'] },
  { id: 11, name: 'Station Bulletin', departmentRootId: null, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Filed'] },
]

export function documentTypeById(id: number): DocumentTypeEntity {
  const found = DOCUMENT_TYPES.find((t) => t.id === id)
  if (!found) throw new Error(`Unknown document type id ${id}`)
  return found
}

export function documentTypeName(id: number): string {
  return documentTypeById(id).name
}