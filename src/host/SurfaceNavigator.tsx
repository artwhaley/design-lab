/**
 * SurfaceNavigator — the finite surface catalog rendered as a Lab sidebar.
 * Selection never branches on Design key (Guardrail 3).
 */
import { SURFACE_CATALOG, type SurfaceDescriptor, type SurfaceKey } from '../contracts'

type Props = {
  active: SurfaceKey
  onSelect(surface: SurfaceDescriptor): void
}

export function SurfaceNavigator({ active, onSelect }: Props) {
  const groups: Array<{ title: string; surfaces: SurfaceDescriptor[] }> = [
    { title: 'Public / Domain', surfaces: SURFACE_CATALOG.filter((s) => ['home', 'records', 'document', 'departments', 'department', 'about', 'lore', 'members', 'character-profile'].includes(s.key)) },
    { title: 'Operational / Management', surfaces: SURFACE_CATALOG.filter((s) => ['work', 'management.departments', 'management.folders', 'management.roles', 'management.documentTypes', 'management.people', 'management.person', 'management.invitations'].includes(s.key)) },
    { title: 'Shared functional (Class B)', surfaces: SURFACE_CATALOG.filter((s) => s.kind === 'classB') },
    { title: 'Compatibility', surfaces: SURFACE_CATALOG.filter((s) => s.kind === 'compatibility') },
  ]

  return (
    <nav className="lab-sidebar" aria-label="Design Lab surfaces">
      <h2>Surfaces</h2>
      {groups.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          {group.surfaces.map((surface) => (
            <button
              key={surface.key}
              type="button"
              className={surface.key === active ? 'lab-active' : undefined}
              aria-current={surface.key === active ? 'page' : undefined}
              onClick={() => onSelect(surface)}
            >
              {surface.label}
              <span className="lab-route-hint">{surface.routeFamily}</span>
            </button>
          ))}
        </section>
      ))}
    </nav>
  )
}
