import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildScenario } from '../fixtures'
import type { LabDesignDefinition } from '../contracts'
import '../designs'
import { resolveDesignRuntime } from '../host/designRuntime'
import { routeContextForSurface } from '../host/routeContext'
import { getDesignDefinition } from '../designs/registry'
import { obsidianConfig } from '../designs/obsidian-lab/config'
import type { ObsidianConfig } from '../designs/obsidian-lab/config'
import { ObsidianShellAdapter } from '../designs/obsidian-lab/adapters/ShellAdapter'

function renderShell(spec: Parameters<typeof buildScenario>[0], surface: 'home' | 'records' | 'document' | 'departments' | 'department' | 'work' = 'home') {
  const builder = buildScenario(spec)
  const design = getDesignDefinition('obsidian-lab') as LabDesignDefinition<ObsidianConfig> | undefined
  if (!design) throw new Error('Obsidian must be registered')
  const runtime = resolveDesignRuntime(design, obsidianConfig.defaults, null).runtime
  if (!runtime) throw new Error('Obsidian defaults must validate')
  render(
    <ObsidianShellAdapter
      model={builder.shellModel()}
      runtime={runtime}
      route={routeContextForSurface(surface, {}, undefined, builder.baseUrl)}
    >
      <div>body</div>
    </ObsidianShellAdapter>,
  )
}

describe('Obsidian source shell adapter', () => {
  it.each([
    ['records', 'Records'],
    ['document', 'Records'],
    ['departments', 'Departments'],
    ['department', 'Departments'],
    ['work', 'Work'],
  ] as const)('marks %s navigation active', (surface, label) => {
    renderShell({ persona: 'admin', dataState: 'populated' }, surface)
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })

  it('renders source-styled visitor sign-in and omits management navigation', () => {
    renderShell({ persona: 'visitor', dataState: 'populated' })
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Manage domain' })).not.toBeInTheDocument()
    expect(screen.queryByText('Acting as')).not.toBeInTheDocument()
  })

  it('renders management navigation through the source shell footer', () => {
    renderShell({ persona: 'admin', dataState: 'populated' })
    expect(screen.getByRole('button', { name: 'Manage domain' })).toBeInTheDocument()
  })
})
