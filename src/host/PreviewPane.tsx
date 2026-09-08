/**
 * PreviewPane — renders one Design's Shell around the selected surface body.
 * The pane applies the resolved CSS variables at its root, wraps the body in
 * the Design Shell, and hands interactive surfaces their fake workspace/action
 * bridges. Click interception keeps fixture links inside the path simulator.
 */
import { useMemo, useRef, useSyncExternalStore } from 'react'
import type { CSSProperties, ReactElement } from 'react'

import type { ClassBSurfaceKey, LabDesignDefinition, SurfaceKey } from '../contracts'
import type { ScenarioBuilder } from '../fixtures'
import { WorkspaceBase, type FakeBackend } from '../workspaces'
import { SharedFunctionalSurface } from './SharedFunctionalSurface'
import type { PaneBridges } from './WorkspaceFactory'
import { createWorkspacesForSurface } from './WorkspaceFactory'
import type { SurfaceParams } from './PathSimulator'
import { routeContextForSurface } from './routeContext'

export type Viewport = { width: number; height: number; label: string }

type Props = {
  design: LabDesignDefinition
  builder: ScenarioBuilder
  backend: FakeBackend
  surface: SurfaceKey
  params: SurfaceParams
  viaCompat?: 'review' | 'subdomains'
  runtime: { config: object; theme: { base: object; vars: Record<string, string> }; cssVars: Record<string, string> }
  viewport: Viewport | null
  onNavigate: (href: string) => void
  testId?: string
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

export function PreviewPane(props: Props) {
  const { design, builder, backend, surface, params, viaCompat, runtime, viewport, onNavigate, testId } = props
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

  // Re-render when any workspace bridge emits (mutations, async results).
  useBridgesVersion(bridges)

  const effectiveSurface: SurfaceKey = viaCompat === 'review' ? 'work' : viaCompat === 'subdomains' ? 'departments' : surface

  const handleClickCapture = (event: React.MouseEvent) => {
    const anchor = (event.target as HTMLElement).closest('a[href]')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href) return
    event.preventDefault()
    navigateRef.current(href)
  }

  const shellModel = builder.shellModel()
  const route = routeContextForSurface(effectiveSurface, params, viaCompat, builder.baseUrl)
  const body = renderSurfaceBody(design, builder, effectiveSurface, params, runtime, bridges)

  const wrapperStyle: CSSProperties = {
    ...runtime.cssVars as CSSProperties,
    background: runtime.cssVars['--tenant-page-bg'] ?? '#ffffff',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  }
  if (viewport) {
    wrapperStyle.width = `${viewport.width}px`
    wrapperStyle.minHeight = `${viewport.height}px`
  }

  return (
    <div data-testid={testId} onClickCapture={handleClickCapture} style={wrapperStyle}>
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
  runtime: Props['runtime'],
  bridges: PaneBridges,
): ReactElement {
  const common = { runtime: runtime as never }
  switch (surface) {
    case 'home':
      return <design.pages.home model={builder.homeModel()} {...common} />
    case 'records':
      return <design.pages.records model={builder.recordsModel()} {...common} workspace={bridges.records!} />
    case 'document': {
      const recordId = params.recordId ?? builder.defaultRecordId() ?? 1
      return <design.pages.document model={builder.documentModel(recordId)} {...common} actions={bridges.document!} />
    }
    case 'departments':
      return <design.pages.departments model={builder.departmentsModel()} {...common} />
    case 'department': {
      const slug = params.departmentSlug ?? builder.universe.departments.find((d) => !d.archived)?.slug ?? 'high-council'
      return <design.pages.department model={builder.departmentModel(slug)} {...common} />
    }
    case 'about':
      return <design.pages.about model={builder.aboutModel()} {...common} />
    case 'lore':
      return <design.pages.lore model={builder.loreModel()} {...common} />
    case 'members':
      return <design.pages.members model={builder.membersModel()} {...common} />
    case 'member': {
      const characterId = params.characterId ?? builder.defaultMemberCharacterId() ?? 1
      return <design.pages.member model={builder.memberModel(characterId)} {...common} />
    }
    case 'work':
      return <design.pages.work model={builder.workModel()} {...common} workspace={bridges.work!} />
    case 'management.departments':
      return <design.pages.management.departments model={builder.managementDepartmentsModel()} {...common} workspace={bridges.departments!} />
    case 'management.folders':
      return <design.pages.management.folders model={builder.managementFoldersModel()} {...common} workspace={bridges.folders!} />
    case 'management.roles':
      return <design.pages.management.roles model={builder.managementRolesModel()} {...common} workspace={bridges.roles!} />
    case 'management.documentTypes':
      return <design.pages.management.documentTypes model={builder.managementDocumentTypesModel()} {...common} workspace={bridges.documentTypes!} />
    case 'management.people':
      return <design.pages.management.people model={builder.managementPeopleModel()} {...common} workspace={bridges.people!} />
    case 'management.person': {
      const characterId = params.characterId ?? builder.defaultPersonCharacterId() ?? 1
      return <design.pages.management.person model={builder.managementPersonModel(characterId)} {...common} workspace={bridges.person!} />
    }
    case 'management.invitations':
      return <design.pages.management.invitations model={builder.managementInvitationsModel()} {...common} workspace={bridges.invitations!} />
    case 'shared.forms':
    case 'shared.templates':
    case 'shared.import':
    case 'shared.documentEdit':
    case 'shared.documentHistory':
    case 'shared.pageEdit':
    case 'shared.siteStudio':
      return <SharedFunctionalSurface surface={surface as ClassBSurfaceKey} baseUrl={builder.baseUrl} />
    default:
      return <div>Unknown surface: {surface}</div>
  }
}
