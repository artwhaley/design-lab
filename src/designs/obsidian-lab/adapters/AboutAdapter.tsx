import type { AboutPageModel, LabPageProps } from '../../../contracts'
import { ObsidianAbout as SourceObsidianAbout } from '../source/ObsidianAbout'
import type { ObsidianConfig } from '../config'
import { mapAboutPageModel } from './sourceMappers'

export function AboutAdapter({ model }: LabPageProps<AboutPageModel, ObsidianConfig>) {
  return <SourceObsidianAbout model={mapAboutPageModel(model)} />
}
