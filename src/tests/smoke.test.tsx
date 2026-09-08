import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabApp } from '../host/LabApp'

describe('Lab scaffold smoke', () => {
  it('renders the Lab chrome with no designs registered', () => {
    render(<LabApp />)
    expect(screen.getByRole('heading', { name: /loreforge design lab/i })).toBeInTheDocument()
    expect(screen.getByText(/select a registered design to preview/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /design lab surfaces/i })).toBeInTheDocument()
  })
})