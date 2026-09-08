import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabApp } from '../host/LabApp'

describe('Lab scaffold smoke', () => {
  it('renders the Lab chrome placeholder', () => {
    render(<LabApp />)
    expect(screen.getByRole('heading', { name: /loreforge design lab/i })).toBeInTheDocument()
    expect(screen.getByText(/contract emulator \+ presentation workbench/i)).toBeInTheDocument()
  })
})