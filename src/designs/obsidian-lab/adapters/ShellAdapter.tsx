import type { ReactNode } from 'react'

import type { LabShellProps } from '../../../contracts'
import { ObsidianShell as SourceObsidianShell } from '../source/ObsidianShell'
import type { ObsidianConfig } from '../config'
import { OperatingContextView } from './OperatingContextView'
import { mapLabConfigToSourceConfig, mapRouteToSourceActive, mapShellModel } from './sourceMappers'

export function ObsidianShellAdapter({ model, runtime, route, children }: LabShellProps<ObsidianConfig> & { children: ReactNode }) {
  const sourceModel = mapShellModel(model)
  return (
    <SourceObsidianShell
      model={sourceModel}
      active={mapRouteToSourceActive(route)}
      operatingContext={<OperatingContextView model={sourceModel} />}
      config={mapLabConfigToSourceConfig(runtime.config)}
    >
      {children}
    </SourceObsidianShell>
  )
}
