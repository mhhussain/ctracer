import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App routing', () => {
  it('renders Dashboard at /', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    // Sidebar is always present
    expect(screen.getByText('ctracer')).toBeInTheDocument()
  })

  it('renders sidebar-backdrop element', () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(container.querySelector('.sidebar-backdrop')).toBeInTheDocument()
  })

  it('sidebar has links to all primary screens', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Exam Blueprint' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Study Plan' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Courses' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Key Concepts' })).toBeInTheDocument()
  })
})
