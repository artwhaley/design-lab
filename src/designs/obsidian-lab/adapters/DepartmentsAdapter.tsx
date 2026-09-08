import type { DepartmentsPageModel, LabPageProps } from '../../../contracts'
import { ObsidianDepartments as SourceObsidianDepartments } from '../source/ObsidianDepartments'
import type { ObsidianConfig } from '../config'
import { mapDepartmentsPageModel } from './sourceMappers'

export function DepartmentsAdapter({ model }: LabPageProps<DepartmentsPageModel, ObsidianConfig>) {
  return <SourceObsidianDepartments model={mapDepartmentsPageModel(model)} />
}
