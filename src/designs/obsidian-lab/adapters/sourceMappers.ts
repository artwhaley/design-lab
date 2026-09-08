import type { DomainShellModel } from '../../../contracts'
import type { LabRouteContext } from '../../../contracts'
import type { ObsidianConfig as SourceObsidianConfig } from '../source/config'
import type { DomainShellModel as SourceDomainShellModel } from '../source/contracts/shell'
import type { ObsidianConfig } from '../config'

export function mapShellModel(model: DomainShellModel): SourceDomainShellModel {
  return {
    domain: { ...model.domain },
    // The frozen source Navigation owns the Work fallback link. Remove the
    // Lab's already-materialized copy so the source list has unique keys.
    primaryNavigation: model.primaryNavigation.filter((item) => item.segment !== 'work').map((item) => ({ ...item })),
    managementNavigation: model.managementNavigation.map((item) => ({ ...item })),
    operatingContext: {
      platformLabel: model.operatingContext.platformLabel,
      availableDomains: model.operatingContext.availableDomains.map((domain) => ({ ...domain })),
      activeDomainId: model.operatingContext.activeDomainId,
      availableCharacters: model.operatingContext.availableCharacters.map((character) => ({ ...character })),
      activeCharacterId: model.operatingContext.activeCharacterId,
      account: model.operatingContext.account ? { ...model.operatingContext.account } : null,
    },
    routes: { ...model.routes },
  }
}

export function mapRouteToSourceActive(route: LabRouteContext): string {
  return route.activeNavigationSegment ?? ''
}

export function mapLabConfigToSourceConfig(config: ObsidianConfig): SourceObsidianConfig {
  return {
    palette: { ...config.palette },
    geometry: { ...config.geometry },
    records: { ...config.records },
    atmosphereImage: config.atmosphereImage,
  }
}
