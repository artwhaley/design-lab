import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { PathSimulator } from '../host/PathSimulator'
import { clearRegistry, registerDesign } from '../designs/registry'
import { makeStubDesign } from './helpers/stubDesign'
import { LabApp } from '../host/LabApp'

describe('path simulator', () => {
  const simulator = new PathSimulator('/domain/aster-reach')

  const surface = (href: string) => {
    const target = simulator.simulate(href)
    return target.kind === 'surface' ? target.surface : `external:${target.href}`
  }

  it('maps every Class A route family', () => {
    expect(surface('/domain/aster-reach')).toBe('home')
    expect(surface('/domain/aster-reach/records')).toBe('records')
    expect(surface('/domain/aster-reach/records?folder=3')).toBe('records')
    expect(surface('/domain/aster-reach/documents/47')).toBe('document')
    expect(surface('/domain/aster-reach/departments')).toBe('departments')
    expect(surface('/domain/aster-reach/departments/survey-cartography')).toBe('department')
    expect(surface('/domain/aster-reach/about')).toBe('about')
    expect(surface('/domain/aster-reach/lore')).toBe('lore')
    expect(surface('/domain/aster-reach/lore/the-tangle')).toBe('lore')
    expect(surface('/domain/aster-reach/members')).toBe('members')
    expect(surface('/domain/aster-reach/members/7')).toBe('member')
    expect(surface('/domain/aster-reach/work')).toBe('work')
  })

  it('maps every management route family', () => {
    expect(surface('/domain/aster-reach/manage/departments')).toBe('management.departments')
    expect(surface('/domain/aster-reach/manage/folders')).toBe('management.folders')
    expect(surface('/domain/aster-reach/roles')).toBe('management.roles')
    expect(surface('/domain/aster-reach/document-types')).toBe('management.documentTypes')
    expect(surface('/domain/aster-reach/manage/people')).toBe('management.people')
    expect(surface('/domain/aster-reach/manage/people/3')).toBe('management.person')
    expect(surface('/domain/aster-reach/manage/invitations')).toBe('management.invitations')
  })

  it('maps Class B and compatibility routes', () => {
    expect(surface('/domain/aster-reach/forms')).toBe('shared.forms')
    expect(surface('/domain/aster-reach/templates/new')).toBe('shared.templates')
    expect(surface('/domain/aster-reach/import')).toBe('shared.import')
    expect(surface('/domain/aster-reach/documents/47/edit')).toBe('shared.documentEdit')
    expect(surface('/domain/aster-reach/documents/47/history')).toBe('shared.documentHistory')
    expect(surface('/domain/aster-reach/pages/home/edit')).toBe('shared.pageEdit')
    expect(surface('/domain/aster-reach/customize')).toBe('shared.siteStudio')
    expect(surface('/domain/aster-reach/review')).toBe('work')
    expect(surface('/domain/aster-reach/subdomains')).toBe('departments')
  })

  it('treats unknown/global links as external', () => {
    expect(surface('https://example.com/login')).toBe('external:https://example.com/login')
    expect(surface('/login')).toBe('external:/login')
    expect(surface('/domain/other-realm/records')).toBe('external:/domain/other-realm/records')
    expect(surface('/domain/aster-reach/records/new')).toBe('external:/domain/aster-reach/records/new')
  })
})

describe('Lab host', () => {
  beforeEach(() => {
    clearRegistry()
    registerDesign(makeStubDesign('stub-one', 'Stub One'))
    registerDesign(makeStubDesign('stub-two', 'Stub Two'))
  })
  afterEach(() => clearRegistry())

  it('boots and renders the selected design shell + home surface', () => {
    render(<LabApp />)
    expect(screen.getByRole('heading', { name: /loreforge design lab/i })).toBeInTheDocument()
    expect(screen.getByTestId('lab-preview')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview')).getByTestId('stub-shell')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview')).getByTestId('stub-home')).toBeInTheDocument()
  })

  it('navigates surfaces from the sidebar without Design-specific branches', () => {
    render(<LabApp />)
    fireEvent.click(screen.getByRole('button', { name: /^records /i }))
    expect(within(screen.getByTestId('lab-preview')).getByTestId('stub-records')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^manage folders /i }))
    expect(within(screen.getByTestId('lab-preview')).getByTestId('stub-m-folders')).toBeInTheDocument()
  })

  it('renders both panes in compare mode with the same surface', () => {
    render(<LabApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByTestId('lab-compare')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-a')).getByTestId('stub-home')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-b')).getByTestId('stub-home')).toBeInTheDocument()
  })
})