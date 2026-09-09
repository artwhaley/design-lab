import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabApp } from '../host/LabApp'

describe('Lab scaffold smoke', () => {
  it('renders the production Obsidian Design in the Lab chrome', () => {
    render(<LabApp />)
    expect(screen.getByRole('heading', { name: /loreforge design lab/i })).toBeInTheDocument()
    expect(within(screen.getByRole('combobox', { name: 'Design' })).getByRole('option', { name: /obsidian/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /design lab surfaces/i })).toBeInTheDocument()
  })
})
