import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { CSSProperties, ReactElement } from 'react'

import type { ClassBSurfaceKey, LabDesignDefinition, SurfaceKey } from '../contracts'
import type { ScenarioBuilder } from '../fixtures'
import { WorkspaceBase, type FakeBackend, type FakeBackendSnapshot } from '../workspaces'
import { SharedFunctionalSurface } from '../host/SharedFunctionalSurface'
import type { PaneBridges } from '../host/WorkspaceFactory'
import { createWorkspacesForSurface } from '../host/WorkspaceFactory'
import type { SurfaceParams } from '../host/PathSimulator'
import { routeContextForSurface } from '../host/routeContext'

export type PreviewRendererProps = {
  design: LabDesignDefinition
  builder: ScenarioBuilder
  backend: FakeBackend
  runtime: { config: object; theme: { base: object; vars: Record<string, string> }; cssVars: Record<string, string> }
  surface: SurfaceKey
  params: SurfaceParams
  viaCompat?: 'review' | 'subdomains'
  onNavigate(href: string): void
  onExternal(href: string): void
  onBackendSnapshot?(snapshot: FakeBackendSnapshot): void
}

function useBridgesVersion(bridges: PaneBridges): number {
  const observable = Object.values(bridges).filter((bridge) => bridge !== undefined && 'getVersion' in bridge) as WorkspaceBase[]
  return useSyncExternalStore(
    (onChange) => {
      const unsubscribers = observable.map((bridge) => bridge.subscribe(onChange))
      return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
    },
    () => observable.reduce((sum, bridge) => sum + bridge.getVersion(), 0),
  )
}

export function PreviewRenderer(props: PreviewRendererProps) {
  const { design, builder, backend, runtime, surface, params, viaCompat, onNavigate, onExternal, onBackendSnapshot } = props
  const navigateRef = useRef(onNavigate)
  navigateRef.current = onNavigate

  const bridgeName = useMemo(() => {
    switch (surface) {
      case 'records': return 'records' as const
      case 'document': return 'document' as const
      case 'work': return 'work' as const
      case 'compat.review': return 'work' as const
      case 'management.departments': return 'departments' as const
      case 'management.folders': return 'folders' as const
      case 'management.roles': return 'roles' as const
      case 'management.documentTypes': return 'documentTypes' as const
      case 'management.people': return 'people' as const
      case 'management.person': return 'person' as const
      case 'management.invitations': return 'invitations' as const
      default: return undefined
    }
  }, [surface])

  const bridges = useMemo(
    () => createWorkspacesForSurface(backend, builder, bridgeName, params, (href) => navigateRef.current(href)),
    [backend, builder, bridgeName, params.recordId, params.characterId, params.departmentSlug],
  )
  const bridgesVersion = useBridgesVersion(bridges)

  const effectiveSurface: SurfaceKey = viaCompat === 'review' ? 'work' : viaCompat === 'subdomains' ? 'departments' : surface
  const shellModel = builder.shellModel()
  const route = routeContextForSurface(effectiveSurface, params, viaCompat, builder.baseUrl)

  useEffect(() => {
    onBackendSnapshot?.(backend.snapshot())
  }, [backend, bridgesVersion, onBackendSnapshot])

  const handleClickCapture = (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const anchor = (event.target as Element | null)?.closest('a[href]')
    if (!anchor || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#')) return
    const url = new URL(href, window.location.href)
    event.preventDefault()
    if (url.origin === window.location.origin && (url.pathname === builder.baseUrl || url.pathname.startsWith(`${builder.baseUrl}/`))) {
      onNavigate(`${url.pathname}${url.search}`)
    } else {
      onExternal(url.toString())
    }
  }

  const wrapperStyle: CSSProperties = {
    ...runtime.cssVars as CSSProperties,
    background: runtime.cssVars['--tenant-page-bg'] ?? '#ffffff',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  }

  const body = renderSurfaceBody(design, builder, effectiveSurface, params, runtime, bridges)

  return (
    <div data-testid="preview-renderer" onClickCapture={handleClickCapture} style={wrapperStyle}>
      <design.Shell model={shellModel} runtime={runtime as never} route={route}>
        {body}
      </design.Shell>
    </div>
  )
}

function renderSurfaceBody(
  design: LabDesignDefinition,
  builder: ScenarioBuilder,
  surface: SurfaceKey,
  params: SurfaceParams,
  runtime: PreviewRendererProps['runtime'],
  bridges: PaneBridges,
): ReactElement {
  const common = { runtime: runtime as never }
  switch (surface) {
    case 'home': return <design.pages.home model={builder.homeModel()} {...common} />
    case 'records': return <design.pages.records model={builder.recordsModel()} {...common} workspace={bridges.records!} />
    case 'document': {
      const recordId = params.recordId ?? builder.defaultRecordId() ?? 1
      return <design.pages.document model={builder.documentModel(recordId)} {...common} actions={bridges.document!} />
    }
    case 'departments': return <design.pages.departments model={builder.departmentsModel()} {...common} />
    case 'department': {
      const slug = params.departmentSlug ?? builder.universe.departments.find((department) => !department.archived)?.slug ?? 'high-council'
      return <design.pages.department model={builder.departmentModel(slug)} {...common} />
    }
    case 'about': return <design.pages.about model={builder.aboutModel()} {...common} />
    case 'lore': return <design.pages.lore model={builder.loreModel()} {...common} />
    case 'members': return <design.pages.members model={builder.membersModel()} {...common} />
    case 'member': {
      const characterId = params.characterId ?? builder.defaultMemberCharacterId() ?? 1
      return <design.pages.member model={builder.memberModel(characterId)} {...common} />
    }
    case 'work': return <design.pages.work model={builder.workModel()} {...common} workspace={bridges.work!} />
    case 'management.departments': return <design.pages.management.departments model={builder.managementDepartmentsModel()} {...common} workspace={bridges.departments!} />
    case 'management.folders': return <design.pages.management.folders model={builder.managementFoldersModel()} {...common} workspace={bridges.folders!} />
    case 'management.roles': return <design.pages.management.roles model={builder.managementRolesModel()} {...common} workspace={bridges.roles!} />
    case 'management.documentTypes': return <design.pages.management.documentTypes model={builder.managementDocumentTypesModel()} {...common} workspace={bridges.documentTypes!} />
    case 'management.people': return <design.pages.management.people model={builder.managementPeopleModel()} {...common} workspace={bridges.people!} />
    case 'management.person': {
      const characterId = params.characterId ?? builder.defaultPersonCharacterId() ?? 1
      return <design.pages.management.person model={builder.managementPersonModel(characterId)} {...common} workspace={bridges.person!} />
    }
    case 'management.invitations': return <design.pages.management.invitations model={builder.managementInvitationsModel()} {...common} workspace={bridges.invitations!} />
    case 'shared.forms':
    case 'shared.templates':
    case 'shared.import':
    case 'shared.documentEdit':
    case 'shared.documentHistory':
    case 'shared.pageEdit':
    case 'shared.siteStudio':
      return <SharedFunctionalSurface surface={surface as ClassBSurfaceKey} baseUrl={builder.baseUrl} />
    default: return <div>Unknown surface: {surface}</div>
  }
}
