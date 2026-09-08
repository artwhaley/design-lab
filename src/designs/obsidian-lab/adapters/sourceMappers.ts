import type {
  AboutPageModel,
  DepartmentsPageModel,
  DocumentPageModel,
  DocumentTypeTreeNode,
  DomainShellModel,
  FolderManagementPageModel,
  HomePageModel,
  LorePageModel,
  RecordsPageModel,
} from '../../../contracts'
import type { LabRouteContext } from '../../../contracts'
import type { HomePageModel as SourceHomePageModel } from '../source/contracts/home'
import type { AboutPageModel as SourceAboutPageModel, LorePageModel as SourceLorePageModel } from '../source/contracts/info'
import type { DepartmentsPageModel as SourceDepartmentsPageModel } from '../source/contracts/departments'
import type { DocumentPageModel as SourceDocumentPageModel } from '../source/contracts/document'
import type { DocumentTypeTreeNode as SourceDocumentTypeTreeNode } from '../source/ObsidianDocumentTypes'
import type { ManagedFolderNode as SourceManagedFolderNode } from '../source/ObsidianFolderManager'
import type { RecordsPageModel as SourceRecordsPageModel } from '../source/contracts/records'
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

export function mapRecordsPageModel(model: RecordsPageModel): SourceRecordsPageModel {
  return {
    baseUrl: model.baseUrl,
    domainSlug: model.domainSlug,
    folders: model.folders.map(mapFolderSummary),
    totalReadableRecordCount: model.totalReadableRecordCount,
    records: model.records.map((record) => ({ ...record })),
    documentTypes: model.documentTypes.map((type) => ({ ...type })),
    supersessionEdges: model.supersessionEdges.map((edge) => ({ ...edge })),
    query: { ...model.query },
    capabilities: { ...model.capabilities },
    vocabulary: { ...model.vocabulary },
  }
}

export function mapDocumentPageModel(model: DocumentPageModel): SourceDocumentPageModel {
  return {
    baseUrl: model.baseUrl,
    domainSlug: model.domainSlug,
    recordId: model.recordId,
    title: model.title,
    bodyHtml: model.bodyHtml,
    bodySource: model.bodySource,
    meta: model.meta.map((item) => ({ ...item })),
    lifecycle: model.lifecycle,
    locked: model.locked,
    isSuperseded: model.isSuperseded,
    supersession: {
      supersededBy: model.supersession.supersededBy ? { ...model.supersession.supersededBy } : null,
      supersedes: model.supersession.supersedes ? { ...model.supersession.supersedes } : null,
    },
    concerns: model.concerns.map((concern) => ({ ...concern })),
    tags: [...model.tags],
    preparedByLabel: model.preparedByLabel,
    capabilities: { ...model.capabilities },
    routes: { ...model.routes },
    statusMessage: model.statusMessage ? { ...model.statusMessage } : null,
  }
}

function mapFolderSummary(folder: RecordsPageModel['folders'][number]): SourceRecordsPageModel['folders'][number] {
  return {
    id: folder.id,
    name: folder.name,
    systemManaged: folder.systemManaged,
    readableRecordCount: folder.readableRecordCount,
    children: folder.children.map(mapFolderSummary),
  }
}

export function mapManagedFolderNodes(model: FolderManagementPageModel): SourceManagedFolderNode[] {
  const mapNode = (node: FolderManagementPageModel['nodes'][number]): SourceManagedFolderNode => ({
    id: String(node.id),
    name: node.name,
    createdLabel: node.createdAt,
    systemManaged: node.systemManaged,
    children: node.children.map(mapNode),
  })
  return model.nodes.map(mapNode)
}

const templateLabel = (mode: Extract<DocumentTypeTreeNode, { kind: 'document-type' }>['templateMode']): SourceDocumentTypeTreeNode['template'] => {
  if (mode === 'markdown') return 'Markdown'
  if (mode === 'form-to-markdown') return 'Form'
  return 'Blank'
}

export function mapDocumentTypeNodes(nodes: DocumentTypeTreeNode[]): SourceDocumentTypeTreeNode[] {
  return nodes.map((node) => ({
    id: node.kind === 'department-root'
      ? `department:${node.id}`
      : node.kind === 'type-folder'
        ? `folder:${node.id}`
        : node.kind === 'document-type'
          ? `type:${node.id}`
          : `unassigned:${node.id}`,
    kind: node.kind === 'department-root'
      ? 'department'
      : node.kind === 'type-folder'
        ? 'folder'
        : node.kind === 'document-type'
          ? 'type'
          : 'unassigned',
    name: node.name,
    children: mapDocumentTypeNodes(node.children),
    ...(node.kind === 'document-type' ? { template: templateLabel(node.templateMode) } : {}),
  }))
}
