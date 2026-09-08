import type { LabPageProps, HomePageModel } from '../../../contracts'
import { ObsidianHome as SourceObsidianHome } from '../source/ObsidianHome'
import type { ObsidianConfig } from '../config'
import { mapHomePageModel } from './sourceMappers'

export function HomeAdapter({ model, runtime }: LabPageProps<HomePageModel, ObsidianConfig>) {
  return (
    <SourceObsidianHome
      model={mapHomePageModel(model)}
      atmosphereImage={runtime.config.atmosphereImage}
    />
  )
}
