import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Card from './Card'
import ProgressBar from './ProgressBar'
import DomainTag from './DomainTag'
import StatTile from './StatTile'
import Pill from './Pill'
import Checkbox from './Checkbox'
import Sidebar from './Sidebar'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>hello</Card>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar value={50} color="accent" height={5} />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('DomainTag', () => {
  it('renders domain number', () => {
    render(<DomainTag domain={{ num: 1, color: 'amber' }} />)
    expect(screen.getByText('D1')).toBeInTheDocument()
  })
})

describe('StatTile', () => {
  it('renders label, value, and sub', () => {
    render(<StatTile label="Courses" value="3/9" sub="2 required" />)
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('3/9')).toBeInTheDocument()
    expect(screen.getByText('2 required')).toBeInTheDocument()
  })
})

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill tone="accent">Active</Pill>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

describe('Checkbox', () => {
  it('calls onChange when clicked', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Task 1" sub="2h" />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Sidebar', () => {
  it('does not have is-open class by default', () => {
    const { container } = render(
      <MemoryRouter><Sidebar /></MemoryRouter>
    )
    expect(container.querySelector('.sidebar')).not.toHaveClass('is-open')
  })

  it('has is-open class when isOpen prop is true', () => {
    const { container } = render(
      <MemoryRouter><Sidebar isOpen={true} onClose={() => {}} /></MemoryRouter>
    )
    expect(container.querySelector('.sidebar')).toHaveClass('is-open')
  })

  it('calls onClose when a nav link is clicked', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>
    )
    await userEvent.click(document.querySelector('.sb-item'))
    expect(onClose).toHaveBeenCalled()
  })
})
