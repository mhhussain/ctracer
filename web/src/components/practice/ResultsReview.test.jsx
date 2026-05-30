// web/src/components/practice/ResultsReview.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultsReview from './ResultsReview'

const noop = () => {}

const perDomain = {
  d1: { correct: 1, total: 1 },
  d2: { correct: 0, total: 1 },
  d3: { correct: 0, total: 0 },
  d4: { correct: 0, total: 0 },
  d5: { correct: 0, total: 0 },
}

// A timed attempt as it exists in memory right after submitExam returns:
// server-resolved instances (no answer key) + a server-provided review.
function timedAttempt() {
  return {
    mode: 'timed',
    score: { correct: 1, total: 2, pct: 50, pass: false, perDomain },
    answers: { 0: 1, 1: 0 },
    instances: [
      { qid: 'tq1', domain: 'd1', _serverResolved: true, stem: 'Stem one?', opts: [{ text: 'A1' }, { text: 'B1' }] },
      { qid: 'tq2', domain: 'd2', _serverResolved: true, stem: 'Stem two?', opts: [{ text: 'A2' }, { text: 'B2' }] },
    ],
    review: [
      { idx: 0, qid: 'tq1', domain: 'd1', correctDisplayPos: 1, selectedPos: 1, isCorrect: true, explanation: 'Because one.' },
      { idx: 1, qid: 'tq2', domain: 'd2', correctDisplayPos: 1, selectedPos: 0, isCorrect: false, explanation: 'Because two.' },
    ],
  }
}

describe('ResultsReview — timed (server-resolved)', () => {
  it('renders per-question review from the server review without crashing', () => {
    render(<ResultsReview attempt={timedAttempt()} posted={null} onPost={noop} onRetake={noop} onHome={noop} onLeaderboard={noop} />)
    // server-resolved stems + option text render
    expect(screen.getByText('Stem one?')).toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()
    // explanation from the server review is shown
    expect(screen.getByText('Because one.')).toBeInTheDocument()
    // correct/incorrect badges derive from review.isCorrect
    expect(screen.getByText('✓ Correct')).toBeInTheDocument()
    expect(screen.getByText('✕ Incorrect')).toBeInTheDocument()
  })

  it('degrades gracefully for a history attempt that has no instances/review', () => {
    const historyAttempt = {
      mode: 'timed',
      score: { correct: 1, total: 2, pct: 50, pass: false, perDomain },
      // no instances, no review (only the score summary is persisted server-side)
    }
    render(<ResultsReview attempt={historyAttempt} posted={null} onPost={noop} onRetake={noop} onHome={noop} onLeaderboard={noop} />)
    // score summary still renders
    expect(screen.getByText('Not yet — keep going')).toBeInTheDocument()
    // per-question section shows the unavailable note instead of crashing
    expect(screen.getByText(/Question breakdown unavailable/i)).toBeInTheDocument()
  })
})
