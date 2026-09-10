import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react'

import type { CharacterProfilePageModel } from '@/lib/page-models/characterProfile'
import type { DesignDefinition } from '@/lib/design/types'
import type { SurfaceKey, ClassBSurfaceKey } from '../contracts'
import type { ScenarioBuilder } from '../fixtures'
import { productionAboutModel, productionCharacterProfileModel, productionDepartmentModel, productionDepartmentsManagementModel, productionDepartmentsModel, productionDocumentModel, productionDocumentTypesManagementModel, productionFoldersManagementModel, productionHomeModel, productionInvitationsManagementModel, productionLoreModel, productionMembersModel, productionPeopleManagementModel, productionPersonManagementModel, productionRecordsModel, productionRolesManagementModel, productionShellModel, productionWorkModel } from '../fixtures/productionModels'
import type { FakeBackend, FakeBackendSnapshot } from '../workspaces'
import { SharedFunctionalSurface } from '../host/SharedFunctionalSurface'
import type { SurfaceParams } from '../host/PathSimulator'
import { routeContextForSurface } from '../host/routeContext'
import type { ProductionRuntime } from '../host/productionRuntime'
import { setPreviewPath } from './navigation'
import { PRODUCTION_PARITY_BASE, productionParityInput, productionParityPageModel, productionParityPath, productionParityShellModel } from './productionParityModels'

export type PreviewRendererProps<TConfig extends object = object> = {
  design: DesignDefinition<TConfig>
  builder: ScenarioBuilder
  backend: FakeBackend
  runtime: ProductionRuntime<TConfig>
  surface: SurfaceKey
  params: SurfaceParams
  viaCompat?: 'review' | 'subdomains'
  onNavigate(href: string): void
  onExternal(href: string): void
  onBackendSnapshot?(snapshot: FakeBackendSnapshot): void
}

export function PreviewRenderer<TConfig extends object>(props: PreviewRendererProps<TConfig>) {
  const { design, builder, backend, runtime, surface, params, viaCompat, onNavigate, onExternal, onBackendSnapshot } = props
  const navigateRef = useRef(onNavigate)
  navigateRef.current = onNavigate
  const effectiveSurface: SurfaceKey = viaCompat === 'review' ? 'work' : viaCompat === 'subdomains' ? 'departments' : surface
  const productionFixtureMode = builder.spec.fixtureProfile === 'production-preview'
  const shellModel = productionFixtureMode ? productionParityShellModel() : productionShellModel(builder)
  const route = routeContextForSurface(effectiveSurface, params, viaCompat, productionFixtureMode ? PRODUCTION_PARITY_BASE : builder.baseUrl)
  if (productionFixtureMode) route.canonicalPath = `${productionParityPath(effectiveSurface)}?design=${encodeURIComponent(design.key)}`
  const activeBaseUrl = productionFixtureMode ? PRODUCTION_PARITY_BASE : builder.baseUrl

  useEffect(() => { setPreviewPath(route.canonicalPath) }, [route.canonicalPath])

  useEffect(() => { onBackendSnapshot?.(backend.snapshot()) }, [backend, onBackendSnapshot])

  const handleClickCapture = (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const anchor = (event.target as Element | null)?.closest('a[href]')
    if (!anchor || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#')) return
    const url = new URL(href, window.location.href)
    event.preventDefault()
    const canonicalBaseUrl = `/domain/${shellModel.domain.slug}`
    if (url.origin === window.location.origin && [activeBaseUrl, canonicalBaseUrl].some(base => url.pathname === base || url.pathname.startsWith(`${base}/`))) onNavigate(`${url.pathname}${url.search}`)
    else onExternal(url.toString())
  }

  const wrapperStyle: CSSProperties = { ...runtime.cssVars as CSSProperties, background: runtime.cssVars['--tenant-page-bg'] ?? '#ffffff', minHeight: '100%', display: 'flex', flexDirection: 'column' }
  const action = async (formData: FormData, operation: 'approve' | 'reject' | 'delete' | 'workflow'): Promise<void> => {
    const recordId = Number(formData.get('documentId'))
    const result = operation === 'delete'
      ? backend.deleteRecord(recordId)
      : operation === 'approve'
        ? backend.approveWorkEntry(recordId)
        : operation === 'reject'
          ? backend.returnWorkEntry(recordId)
          : backend.setLifecycle(recordId, String(formData.get('operation')) === 'submit' ? 'submitted' : 'filed', String(formData.get('operation') ?? 'workflow'))
    onBackendSnapshot?.(backend.snapshot())
    void result
  }
  const body = renderSurfaceBody(design, builder, effectiveSurface, params, runtime, productionFixtureMode, {
    workflowAction: (formData) => action(formData, 'workflow'),
    deleteAction: (formData) => action(formData, 'delete'),
    approveAction: (formData) => action(formData, 'approve'),
    rejectAction: (formData) => action(formData, 'reject'),
  })
  return <div data-testid="preview-renderer" onClickCapture={handleClickCapture} style={wrapperStyle}>
    {productionFixtureMode ? <div hidden data-parity-input>{JSON.stringify(productionParityInput(effectiveSurface, runtime.cssVars, runtime.config))}</div> : null}
    <design.Shell model={shellModel} theme={{ tokens: runtime.cssVars, headerLayout: '', documentStyle: '' }} designConfig={runtime.config}>
      {body}
    </design.Shell>
  </div>
}

function renderSurfaceBody<TConfig extends object>(
  design: DesignDefinition<TConfig>,
  builder: ScenarioBuilder,
  surface: SurfaceKey,
  params: SurfaceParams,
  runtime: ProductionRuntime<TConfig>,
  productionFixtureMode: boolean,
  actions: {
    workflowAction: (formData: FormData) => Promise<void>
    deleteAction: (formData: FormData) => Promise<void>
    approveAction: (formData: FormData) => Promise<void>
    rejectAction: (formData: FormData) => Promise<void>
  },
): ReactElement {
  const designConfig = runtime.config
  const parityPage = (key: SurfaceKey): unknown => productionParityPageModel(key)
  switch (surface) {
    case 'home': return <design.pages.home {...(productionFixtureMode ? parityPage('home') as ReturnType<typeof productionHomeModel> : productionHomeModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'records': return <design.pages.records {...(productionFixtureMode ? parityPage('records') as ReturnType<typeof productionRecordsModel> : productionRecordsModel(builder))} designConfig={designConfig} />
    case 'document': {
      const recordId = params.recordId ?? builder.defaultRecordId() ?? 1
      return <design.pages.document {...(productionFixtureMode ? parityPage('document') as ReturnType<typeof productionDocumentModel> : productionDocumentModel(builder, recordId))} designConfig={designConfig} headerLayout="" documentStyle="" workflowAction={actions.workflowAction} deleteAction={actions.deleteAction} />
    }
    case 'departments': return <design.pages.departments {...(productionFixtureMode ? parityPage('departments') as ReturnType<typeof productionDepartmentsModel> : productionDepartmentsModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'department': {
      const slug = params.departmentSlug ?? builder.universe.departments.find((department) => !department.archived)?.slug ?? 'high-council'
      return <design.pages.department {...(productionFixtureMode ? parityPage('department') as ReturnType<typeof productionDepartmentModel> : productionDepartmentModel(builder, slug))} designConfig={designConfig} headerLayout="" documentStyle="" />
    }
    case 'about': return <design.pages.about {...(productionFixtureMode ? parityPage('about') as ReturnType<typeof productionAboutModel> : productionAboutModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'lore': return <design.pages.lore {...(productionFixtureMode ? parityPage('lore') as ReturnType<typeof productionLoreModel> : productionLoreModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'members': return <design.pages.members {...(productionFixtureMode ? parityPage('members') as ReturnType<typeof productionMembersModel> : productionMembersModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'work': return <design.pages.work {...(productionFixtureMode ? parityPage('work') as ReturnType<typeof productionWorkModel> : productionWorkModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" approveAction={actions.approveAction} rejectAction={actions.rejectAction} />
    case 'character-profile': {
      const characterId = params.characterId ?? builder.universe.members[0]?.id ?? 1
      const model = productionFixtureMode ? parityPage('character-profile') as CharacterProfilePageModel : productionCharacterProfileModel(builder, characterId)
      return design.pages.characterProfile
        ? <design.pages.characterProfile {...model} designConfig={designConfig} headerLayout="" documentStyle="" />
        : <main><a href={`${builder.baseUrl}/members`}>Back to members</a><h1>{model.character.name}</h1></main>
    }
    case 'management.departments': return <design.pages.management.departments {...(productionFixtureMode ? parityPage('management.departments') as ReturnType<typeof productionDepartmentsManagementModel> : productionDepartmentsManagementModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'management.folders': return <design.pages.management.folders {...(productionFixtureMode ? parityPage('management.folders') as ReturnType<typeof productionFoldersManagementModel> : productionFoldersManagementModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'management.roles': return <design.pages.management.roles {...(productionFixtureMode ? parityPage('management.roles') as ReturnType<typeof productionRolesManagementModel> : productionRolesManagementModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'management.documentTypes': return <design.pages.management.documentTypes {...(productionFixtureMode ? parityPage('management.documentTypes') as ReturnType<typeof productionDocumentTypesManagementModel> : productionDocumentTypesManagementModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'management.people': return <design.pages.management.people {...(productionFixtureMode ? parityPage('management.people') as ReturnType<typeof productionPeopleManagementModel> : productionPeopleManagementModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'management.person': {
      const characterId = params.characterId ?? builder.defaultPersonCharacterId() ?? 1
      return <design.pages.management.person {...(productionFixtureMode ? parityPage('management.person') as ReturnType<typeof productionPersonManagementModel> : productionPersonManagementModel(builder, characterId))} designConfig={designConfig} headerLayout="" documentStyle="" />
    }
    case 'management.invitations': return <design.pages.management.invitations {...(productionFixtureMode ? parityPage('management.invitations') as ReturnType<typeof productionInvitationsManagementModel> : productionInvitationsManagementModel(builder))} designConfig={designConfig} headerLayout="" documentStyle="" />
    case 'shared.forms':
    case 'shared.templates':
    case 'shared.import':
    case 'shared.documentEdit':
    case 'shared.documentHistory':
    case 'shared.pageEdit':
    case 'shared.siteStudio': return <SharedFunctionalSurface surface={surface as ClassBSurfaceKey} baseUrl={builder.baseUrl} />
    default: return <div>Unknown surface: {surface}</div>
  }
}
