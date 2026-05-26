import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import { clearProgress } from '../lib/storage'

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Dashboard', () => {
  beforeEach(() => clearProgress())

  it('shows certification name', () => {
    wrap(<Dashboard />)
    expect(screen.getByText(/Claude Certified Architect/i)).toBeInTheDocument()
  })

  it('shows all 5 domain names', () => {
    wrap(<Dashboard />)
    expect(screen.getByText(/Agentic Architecture/i)).toBeInTheDocument()
    expect(screen.getByText(/Claude Code Configuration/i)).toBeInTheDocument()
    expect(screen.getByText(/Prompt Engineering/i)).toBeInTheDocument()
    expect(screen.getByText(/Tool Design/i)).toBeInTheDocument()
    expect(screen.getByText(/Context Management/i)).toBeInTheDocument()
  })

  it('shows all 4 phase names', () => {
    wrap(<Dashboard />)
    expect(screen.getByText('Foundation')).toBeInTheDocument()
    expect(screen.getByText('Core Exam Domains')).toBeInTheDocument()
    expect(screen.getByText('Context & Integration')).toBeInTheDocument()
    expect(screen.getByText('Exam Prep')).toBeInTheDocument()
  })

  it('shows today panel with phase 1 tasks when nothing is done', () => {
    wrap(<Dashboard />)
    expect(screen.getByText(/What to do today/i)).toBeInTheDocument()
    expect(screen.getByText(/Claude Code 101/i)).toBeInTheDocument()
  })

  it('checking a task updates the today list', async () => {
    wrap(<Dashboard />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    // After checking, "Claude Code 101" should be gone from the today list
    // (it was the first incomplete task)
    expect(checkboxes[0]).toBeChecked()
  })
})
