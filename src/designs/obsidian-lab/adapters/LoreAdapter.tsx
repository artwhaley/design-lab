import type { LabPageProps, LorePageModel } from '../../../contracts'
import { ObsidianLore as SourceObsidianLore } from '../source/ObsidianLore'
import type { ObsidianConfig } from '../config'
import { mapLorePageModel } from './sourceMappers'

export function LoreAdapter({ model }: LabPageProps<LorePageModel, ObsidianConfig>) {
  return <SourceObsidianLore model={mapLorePageModel(model)} />
}
