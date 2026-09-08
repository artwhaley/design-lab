import type { Action } from '../source/controls'
import { DocumentActions as SourceDocumentActions } from '../source/DocumentActions'
import { ObsidianDocument as SourceObsidianDocument } from '../source/ObsidianDocument'
import type { DocumentPageProps } from '../../../contracts'
import type { ObsidianConfig } from '../config'
import { mapDocumentPageModel } from './sourceMappers'

export function DocumentAdapter({ model, actions }: DocumentPageProps<ObsidianConfig>) {
  const items: Action[] = actions.actions
    .filter((action) => action.state !== 'absent')
    .map((action) => ({
      key: action.key,
      label: action.label,
      disabled: action.state === 'disabled',
      danger: action.kind === 'destructive',
    }))

  return (
    <SourceObsidianDocument
      model={mapDocumentPageModel(model)}
      actions={items.length ? <SourceDocumentActions items={items} onAction={(action) => void actions.run(action.key)} /> : null}
    />
  )
}
