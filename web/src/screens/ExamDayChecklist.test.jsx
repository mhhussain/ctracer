import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ExamDayChecklist from './ExamDayChecklist'
import { clearProgress, saveProgress } from '../lib/storage'
import { COURSES, PROJECTS } from '../data/index'

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('ExamDayChecklist', () => {
  beforeEach(() => clearProgress())

  it('renders the exam logistics hero card', () => {
    wrap(<ExamDayChecklist />)
    expect(screen.getByText('Exam logistics')).toBeInTheDocument()
    expect(screen.getByText('120 min')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('720 / 1000')).toBeInTheDocument()
  })

  it('renders all 9 checklist items', () => {
    wrap(<ExamDayChecklist />)
    expect(screen.getByText('All 4 Partner Network courses complete')).toBeInTheDocument()
    expect(screen.getByText('All 5 projects built')).toBeInTheDocument()
    expect(screen.getByText('Practice questions scoring 80%+')).toBeInTheDocument()
  })

  it('shows 0% ready when nothing is done', () => {
    wrap(<ExamDayChecklist />)
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('0 / 9 ready')).toBeInTheDocument()
  })

  it('x1 is unchecked when no partner courses are complete', () => {
    wrap(<ExamDayChecklist />)
    // x1 is the first checkbox (auto-derived)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).not.toBeChecked()
  })

  it('x1 is checked when all partner courses are complete', () => {
    const partnerCourses = COURSES.filter((c) => c.partnerRequired)
    const courses = Object.fromEntries(partnerCourses.map((c) => [c.id, true]))
    saveProgress(null, { courses, projects: {}, tasks: {}, exam_day: {}, practiceScore: null })

    wrap(<ExamDayChecklist />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).toBeChecked()
  })

  it('x2 is unchecked when no projects are complete', () => {
    wrap(<ExamDayChecklist />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]).not.toBeChecked()
  })

  it('x2 is checked when all projects are complete', () => {
    const projects = Object.fromEntries(PROJECTS.map((p) => [p.id, 'complete']))
    saveProgress(null, { courses: {}, projects, tasks: {}, exam_day: {}, practiceScore: null })

    wrap(<ExamDayChecklist />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]).toBeChecked()
  })

  it('x2 is unchecked when some projects are only in_progress', () => {
    const projects = Object.fromEntries(PROJECTS.map((p) => [p.id, 'in_progress']))
    saveProgress(null, { courses: {}, projects, tasks: {}, exam_day: {}, practiceScore: null })

    wrap(<ExamDayChecklist />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]).not.toBeChecked()
  })

  it('manual checklist items can be toggled', async () => {
    wrap(<ExamDayChecklist />)
    // x3 is the third checkbox (index 2), a manual item
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[2]).not.toBeChecked()
    await userEvent.click(checkboxes[2])
    expect(checkboxes[2]).toBeChecked()
  })

  it('x1 and x2 auto-derived checkboxes are disabled', () => {
    wrap(<ExamDayChecklist />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).toBeDisabled()
    expect(checkboxes[1]).toBeDisabled()
  })

  it('shows 100% ready and is-ready class when all items are done', () => {
    const partnerCourses = COURSES.filter((c) => c.partnerRequired)
    const courses = Object.fromEntries(partnerCourses.map((c) => [c.id, true]))
    const projects = Object.fromEntries(PROJECTS.map((p) => [p.id, 'complete']))
    const exam_day = { x3: true, x4: true, x5: true, x6: true, x7: true, x8: true, x9: true }
    saveProgress(null, { courses, projects, tasks: {}, exam_day, practiceScore: null })

    wrap(<ExamDayChecklist />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('9 / 9 ready')).toBeInTheDocument()
    // The hero card should have the is-ready class
    const hero = document.querySelector('.exam-hero.is-ready')
    expect(hero).not.toBeNull()
  })
})
