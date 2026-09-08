import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { LabDesignDefinition, SurfaceKey } from '../contracts'
import '../designs'
import { getDesignDefinition } from '../designs/registry'
import { obsidianConfig } from '../designs/obsidian-lab/config'
import { buildScenario, type ScenarioSpec } from '../fixtures'
import { resolveDesignRuntime } from '../host/designRuntime'
import { FakeBackend, ActionLog } from '../workspaces'

const design = () => getDesignDefinition('obsidian-lab') as LabDesignDefinition

function renderStatic(surface: Extract<SurfaceKey, 'home' | 'about' | 'lore' | 'departments' | 'members' | 'member'>, spec: ScenarioSpec) {
  const backend = new FakeBackend(buildScenario(spec), new ActionLog(), 0)
  const runtime = resolveDesignRuntime(design(), obsidianConfig.defaults, null).runtime
  if (!runtime) throw new Error('Obsidian defaults must validate')

  const model = surface === 'home'
    ? backend.builder.homeModel()
    : surface === 'about'
      ? backend.builder.aboutModel()
      : surface === 'lore'
        ? backend.builder.loreModel()
        : surface === 'departments'
          ? backend.builder.departmentsModel()
          : surface === 'members'
            ? backend.builder.membersModel()
            : backend.builder.memberModel(backend.builder.defaultMemberCharacterId() ?? 1)

  const Page = design().pages[surface]
  const { container } = render(<Page model={model as never} runtime={runtime as never} />)
  return container
}

function hasSourceClass(container: Element, className: string) {
  return Array.from(container.querySelectorAll('*')).some((element) => element.getAttribute('class')?.includes(className))
}

describe('Obsidian static source adapters', () => {
  it('uses the frozen Home visual and preserves the empty recent-record state', () => {
    const container = renderStatic('home', { persona: 'admin', dataState: 'populated' })
    expect(hasSourceClass(container, 'hero')).toBe(true)
    expect(within(container).getByText('THE DOMAIN ARCHIVE')).toBeInTheDocument()

    renderStatic('home', { persona: 'visitor', dataState: 'empty' })
    expect(screen.getByText('Your archive is ready.')).toBeInTheDocument()
  })

  it('uses the frozen About, Lore, and Departments visual structures', () => {
    const about = renderStatic('about', { persona: 'visitor', dataState: 'populated' })
    expect(hasSourceClass(about, 'aboutHero')).toBe(true)
    expect(within(about).getByRole('navigation', { name: 'Continue exploring' })).toBeInTheDocument()

    const lore = renderStatic('lore', { persona: 'admin', dataState: 'populated' })
    expect(hasSourceClass(lore, 'lorePage')).toBe(true)
    expect(within(lore).getByRole('complementary', { name: 'Lore index' })).toBeInTheDocument()
    expect(within(lore).getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)

    const departments = renderStatic('departments', { persona: 'visitor', dataState: 'populated' })
    expect(hasSourceClass(departments, 'departmentGrid')).toBe(true)
    expect(within(departments).getByRole('region', { name: 'Departments' })).toBeInTheDocument()
  })

  it('renders truthful member directory/profile extensions for populated and empty data', () => {
    const members = renderStatic('members', { persona: 'admin', dataState: 'populated' })
    expect(hasSourceClass(members, 'departmentGrid')).toBe(true)
    expect(within(members).getByText('Captain Ilyas Vance')).toBeInTheDocument()

    const profile = renderStatic('member', { persona: 'visitor', dataState: 'empty' })
    expect(hasSourceClass(profile, 'characterProfileHero')).toBe(true)
    expect(within(profile).getByText(/No records prepared by/i)).toBeInTheDocument()
  })
})
