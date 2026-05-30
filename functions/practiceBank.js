// functions/practiceBank.js
// Server-only timed question bank. NEVER imported by web/ — answer key stays server-side.

// ─── Domain list (inlined — cannot import from web/) ────────────────────────
const DOMAINS = [
  { id: 'd1', num: 1 },
  { id: 'd2', num: 2 },
  { id: 'd3', num: 3 },
  { id: 'd4', num: 4 },
  { id: 'd5', num: 5 },
]

// ─── Blueprint (must match web client: 16+12+12+11+9 = 60) ──────────────────
export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }

export const PASS_PCT = 72

// ─── Topics per domain (names match web/src/data/index.js, inlined here) ────
const TOPICS = {
  d1: [
    { name: 'Multi-agent patterns' },
    { name: 'Agentic loops' },
    { name: 'Session management' },
    { name: 'Tool orchestration' },
    { name: 'Parallelization workflows' },
    { name: 'Chaining workflows' },
    { name: 'Routing workflows' },
    { name: 'Fallback loop design' },
    { name: 'Cost optimization' },
  ],
  d2: [
    { name: 'CLAUDE.md hierarchies' },
    { name: 'Custom slash commands' },
    { name: 'Agent Skills' },
    { name: 'Hooks' },
    { name: 'MCP server integration' },
    { name: 'GitHub integration' },
    { name: 'Context management' },
    { name: 'Claude Code SDK' },
    { name: 'Subagents' },
    { name: 'Tool access restrictions' },
    { name: 'Configuration files' },
  ],
  d3: [
    { name: 'System prompts' },
    { name: 'XML tags' },
    { name: 'Few-shot examples' },
    { name: 'Chain-of-thought' },
    { name: 'JSON schema enforcement' },
    { name: 'Structured output' },
    { name: 'Validation retry loops' },
    { name: 'Hallucination prevention' },
    { name: 'Failure modes' },
    { name: 'Prompt evaluation' },
    { name: 'Temperature & sampling' },
    { name: 'Prompt caching' },
  ],
  d4: [
    { name: 'Tool use fundamentals' },
    { name: 'Multi-tool systems' },
    { name: 'MCP architecture' },
    { name: 'MCP server building' },
    { name: 'MCP primitives' },
    { name: 'MCP client implementation' },
    { name: 'Static vs templated resources' },
    { name: 'MCP Server Inspector' },
    { name: 'Web search tool' },
    { name: 'Tool-use error handling' },
    { name: 'Tool selection' },
  ],
  d5: [
    { name: 'Context window limits' },
    { name: 'Model selection' },
    { name: 'Prompt caching' },
    { name: 'RAG fundamentals' },
    { name: 'Context discipline' },
    { name: 'Streaming responses' },
    { name: 'Rate limits & errors' },
    { name: 'Extended thinking' },
    { name: 'Image and PDF support' },
    { name: 'Citations' },
    { name: 'Files API & Code Execution' },
    { name: 'Output evaluation' },
  ],
}

// ─── TIMED content pools (distinct wordings from the practice set) ───────────

// Each entry is an array of phrase variants (2–3 each)
const CORRECT_POOL = [
  [
    'Implement the authoritative pattern and run end-to-end validation.',
    'Follow the canonical approach and verify correctness before proceeding.',
    'Apply the established best practice with full validation before moving on.',
  ],
  [
    'Adopt explicit error handling with a defined fallback strategy.',
    'Handle failures explicitly with a fallback path and structured retry.',
    'Use structured error handling and a documented fallback.',
  ],
  [
    'Select the model tier appropriate to the task and constrain the output schema.',
    'Match model capability to the step complexity and enforce a typed output contract.',
    'Right-size the model and bind output to a declared schema.',
  ],
]

const DISTRACTOR_POOL = [
  ['Omit validation and accept the first available result.', 'Skip the validation step and trust the initial output.'],
  ['Apply the highest-capability model uniformly across every step.', 'Default to top-tier models for all pipeline stages.'],
  ['Consolidate all context into a single unstructured request.', 'Combine everything into one prompt without structure.'],
  ['Retry without backoff until a response is received.', 'Loop indefinitely until the call succeeds.', 'Retry continuously with no delay or exit condition.'],
  ['Discard returned error signals and continue processing.', 'Suppress errors and proceed unconditionally.'],
  ['Embed the behavior as fixed logic with no edge-case coverage.', 'Hard-code the path and skip edge-case handling.'],
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick `n` distinct items from `pool` (wraps if pool.length < n).
 */
function pick(pool, n) {
  const result = []
  const shuffled = shuffle(pool)
  for (let i = 0; i < n; i++) {
    result.push(shuffled[i % shuffled.length])
  }
  return result
}

function stemVariants(topic) {
  const t = topic.name.toLowerCase()
  return [
    `In a production Claude system, what is the correct approach to ${t}?`,
    `Your team needs to handle ${t} in a multi-agent pipeline. Which pattern applies?`,
    `A Claude Certified Architect is reviewing ${t} implementation. What should they recommend?`,
  ]
}

// ─── Build stable bank ───────────────────────────────────────────────────────

let qCounter = 0
export const BANK = []

DOMAINS.forEach((d) => {
  const count = BLUEPRINT[d.id]
  for (let i = 0; i < count; i++) {
    const topic = TOPICS[d.id][i % TOPICS[d.id].length]
    const correct = CORRECT_POOL[(qCounter + i) % CORRECT_POOL.length]
    const distractors = pick(DISTRACTOR_POOL, 3)
    const options = [
      { correct: true, text: correct },
      ...distractors.map((dd) => ({ correct: false, text: dd })),
    ]
    BANK.push({
      id: `tq${++qCounter}`,
      domain: d.id,
      topicName: topic.name,
      stem: stemVariants(topic),
      options,
      explanation: `Timed exam placeholder — correct answer applies the "${topic.name}" best practice from Domain ${d.num}. Full rationale added with real content.`,
    })
  }
})

// ─── Session builder ──────────────────────────────────────────────────────────

/**
 * Build a new exam session.
 * Returns:
 *   - `instances`: full server-side records including the answer key (store in Firestore)
 *   - `sanitized`: client-safe question list (no `correct` field, no explanation)
 */
export function buildSession() {
  const order = shuffle(BANK)
  const instances = order.map((q) => {
    const optOrder = shuffle(q.options.map((_, i) => i))
    return {
      qid: q.id,
      domain: q.domain,
      stemIdx: Math.floor(Math.random() * q.stem.length),
      optOrder,
      phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.text.length)),
      // server-side only: index of the correct option in the original options array
      correctOrigIdx: q.options.findIndex((o) => o.correct),
    }
  })

  const sanitized = instances.map((inst) => {
    const q = BANK.find((b) => b.id === inst.qid)
    const opts = inst.optOrder.map((origIdx) => ({
      origIdx,
      text: q.options[origIdx].text[inst.phraseIdx[origIdx] % q.options[origIdx].text.length],
      // NO `correct` field — answer key stays server-side
    }))
    return {
      qid: inst.qid,
      domain: inst.domain,
      stem: q.stem[inst.stemIdx],
      opts,
      // No explanation yet — revealed by submitExam after submission
    }
  })

  return { instances, sanitized }
}

// ─── Scorer ───────────────────────────────────────────────────────────────────

/**
 * Score a completed session.
 *
 * @param {object[]} instances  - server-stored full instances (with correctOrigIdx)
 * @param {object}   answers    - map of instanceIndex → selectedDisplayPosition
 * @returns {{ score, review }}
 */
export function scoreSession(instances, answers) {
  let correct = 0
  const perDomain = {
    d1: { correct: 0, total: 0 },
    d2: { correct: 0, total: 0 },
    d3: { correct: 0, total: 0 },
    d4: { correct: 0, total: 0 },
    d5: { correct: 0, total: 0 },
  }

  const review = instances.map((inst, idx) => {
    perDomain[inst.domain].total++
    const sel = answers[idx]
    const correctDisplayPos = inst.optOrder.indexOf(inst.correctOrigIdx)
    const isCorrect = sel !== undefined && Number(sel) === correctDisplayPos
    if (isCorrect) {
      correct++
      perDomain[inst.domain].correct++
    }
    const q = BANK.find((b) => b.id === inst.qid)
    return {
      idx,
      qid: inst.qid,
      domain: inst.domain,
      correctDisplayPos,
      selectedPos: sel !== undefined ? Number(sel) : null,
      isCorrect,
      explanation: q.explanation,
    }
  })

  const total = instances.length
  const pct = Math.round((correct / total) * 100)
  return {
    score: { correct, total, pct, pass: pct >= PASS_PCT, perDomain },
    review,
  }
}
