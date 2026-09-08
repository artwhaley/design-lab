import type {
  AboutPageModel,
  DepartmentsPageModel,
  DomainShellModel,
  HomePageModel,
  LorePageModel,
} from '../../../contracts'
import type { LabRouteContext } from '../../../contracts'
import type { HomePageModel as SourceHomePageModel } from '../source/contracts/home'
import type { AboutPageModel as SourceAboutPageModel, LorePageModel as SourceLorePageModel } from '../source/contracts/info'
import type { DepartmentsPageModel as SourceDepartmentsPageModel } from '../source/contracts/departments'
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

export function mapHomePageModel(model: HomePageModel): SourceHomePageModel {
  return {
    baseUrl: model.baseUrl,
    domain: { ...model.domain },
    welcome: { ...model.welcome },
    destinations: model.destinations.map((item) => ({ ...item })),
    recentRecords: model.recentRecords.map((record) => ({ ...record })),
  }
}

export function mapAboutPageModel(model: AboutPageModel): SourceAboutPageModel {
  return {
    baseUrl: model.baseUrl,
    bodyHtml: model.bodyHtml,
    editHref: model.editHref,
    destinations: model.destinations.map((item) => ({ ...item })),
  }
}

export function mapLorePageModel(model: LorePageModel): SourceLorePageModel {
  return {
    baseUrl: model.baseUrl,
    // The Lab contract currently supplies no separate introduction or article
    // body. Empty values preserve the source overview shape without inventing
    // domain copy; the pressure is recorded in PRESSURE.md.
    introduction: '',
    destinations: model.destinations.map((item) => ({ ...item })),
    entries: model.entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      group: entry.group,
      summary: entry.summary,
      updatedLabel: entry.revisionLabel ?? '',
      bodyHtml: '',
    })),
  }
}

export function mapDepartmentsPageModel(model: DepartmentsPageModel): SourceDepartmentsPageModel {
  return {
    baseUrl: model.baseUrl,
    domainSlug: model.domainSlug,
    domainName: model.domainName,
    departments: model.departments.map((department) => ({ ...department })),
    manageHref: model.manageHref,
    vocabulary: { ...model.vocabulary },
  }
}
