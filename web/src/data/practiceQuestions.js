// web/src/data/practiceQuestions.js
// CCA-F Practice Exam — placeholder question bank (PRACTICE content set ONLY).
// Ported from docs/superpowers/specs/practice-exam-design/practice-data.js.
// Placeholder content; ~100 real questions supplied later by the maintainer.
//
// ⚠️ ANSWER-KEY ISOLATION: this file holds ONLY the `practice` wordings (1-2 per
// stem/option). The `timed` content set + answer key live exclusively in
// functions/practiceBank.js (Task 10) and must never be imported here, so the
// timed answer key never ships in the web bundle.
import { DOMAINS } from './index'

export const PASS_PCT = 72
export const DURATION_MIN = 120
// Blueprint weighting — must total 60.
export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }

// ---- PRACTICE phrasing pools (1-2 equivalent variants shown at random) ----
const CORRECT_POOL = [
  [
    'Apply the documented best-practice pattern and validate before continuing.',
    'Use the recommended pattern, then verify the output.',
  ],
  [
    'Use the recommended approach with explicit error handling and a fallback.',
    'Handle errors explicitly and add a fallback path.',
  ],
  [
    'Right-size the model for the step and constrain output to a schema.',
    'Match the model tier to the task and enforce an output schema.',
  ],
]
const DISTRACTOR_POOL = [
  ['Skip validation and trust the first response.'],
  [
    'Use the most expensive model tier for every step.',
    'Default to the top-tier model everywhere.',
  ],
  ['Cram all context into one unstructured prompt.'],
  [
    'Retry indefinitely with no backoff.',
    'Loop forever on failure with no exit.',
  ],
  ['Ignore returned errors and proceed.'],
  ['Hard-code the behavior and ignore edge cases.'],
]

function pick(arr, n) {
  // return n distinct random elements
  const copy = arr.slice()
  const out = []
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

// PRACTICE stems only (1-2 wordings). Timed stems are authored server-side.
function stemVariants(topic) {
  const t = topic.name.toLowerCase()
  return [
    `Which approach best handles ${t} in a production Claude system?`,
    `A team is implementing ${t}. What is the recommended pattern?`,
  ]
}

// ---- build a stable bank ----
let qCounter = 0
export const BANK = []
DOMAINS.forEach((d) => {
  const count = BLUEPRINT[d.id]
  for (let i = 0; i < count; i++) {
    const topic = d.topics[i % d.topics.length]
    const correct = CORRECT_POOL[(qCounter + i) % CORRECT_POOL.length]
    const distractors = pick(DISTRACTOR_POOL, 3)
    const options = [
      { correct: true, text: correct },
      ...distractors.map((dd) => ({ correct: false, text: dd })),
    ]
    BANK.push({
      id: `q${++qCounter}`,
      domain: d.id,
      topicName: topic.name,
      stem: stemVariants(topic),
      options,
      explanation:
        `Placeholder explanation — the correct choice applies the "${topic.name}" best practice from Domain ${d.num}; ` +
        `the distractors are common anti-patterns. Full rationale will be added with the real question content.`,
    })
  }
})

export function questionById(id) {
  return BANK.find((q) => q.id === id)
}
