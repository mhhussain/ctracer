// data/validateBank.mjs
// Structural validator for the exam question bank. Run: node data/validateBank.mjs
// Pass --complete to also require the full 60-question blueprint (final gate).
import { QUESTIONS, BLUEPRINT, TOPICS } from './examQuestionBank.mjs'

const DOMAINS = ['d1', 'd2', 'd3', 'd4', 'd5']
const ARCHETYPES = ['best-practice', 'what-breaks', 'critique-output', 'tradeoff', 'foundational']
const DIFFICULTIES = ['core', 'scenario', 'hard']
const DIMENSIONS = ['critical-eval', 'judgment', 'framing']
const requireComplete = process.argv.includes('--complete')

const errors = []
const warnings = []
const seenIds = new Set()
const perDomain = Object.fromEntries(DOMAINS.map((d) => [d, 0]))
const perArchetype = Object.fromEntries(ARCHETYPES.map((a) => [a, 0]))
const err = (id, msg) => errors.push(`[${id}] ${msg}`)

for (const q of QUESTIONS) {
  const id = q.id ?? '(missing id)'
  if (!/^d[1-5]-\d{3}$/.test(q.id ?? '')) err(id, 'id must match d{n}-{NNN}')
  if (seenIds.has(q.id)) err(id, 'duplicate id')
  seenIds.add(q.id)

  if (!DOMAINS.includes(q.domain)) {
    err(id, `domain "${q.domain}" invalid`)
  } else {
    perDomain[q.domain]++
    if (!q.id?.startsWith(q.domain + '-')) err(id, `id prefix must match domain ${q.domain}`)
    if (!TOPICS[q.domain]?.includes(q.topic)) err(id, `topic "${q.topic}" not in TOPICS.${q.domain}`)
  }

  if (!ARCHETYPES.includes(q.archetype)) err(id, `archetype "${q.archetype}" invalid`)
  else perArchetype[q.archetype]++
  if (!DIFFICULTIES.includes(q.difficulty)) err(id, `difficulty "${q.difficulty}" invalid`)

  if (!Array.isArray(q.dimensions)) err(id, 'dimensions must be an array')
  else for (const dim of q.dimensions) if (!DIMENSIONS.includes(dim)) err(id, `dimension "${dim}" invalid`)

  if (typeof q.claudeSpecific !== 'boolean') err(id, 'claudeSpecific must be boolean')

  if (!Array.isArray(q.stem) || q.stem.length < 2) err(id, 'stem must have >= 2 wordings')
  else if (q.stem.some((s) => typeof s !== 'string' || !s.trim())) err(id, 'stem wordings must be non-empty strings')

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    err(id, 'options must have exactly 4 entries')
  } else {
    q.options.forEach((opt, i) => {
      for (const mode of ['practice', 'timed']) {
        if (!Array.isArray(opt?.[mode]) || opt[mode].length < 1) err(id, `option ${i} ${mode} must be a non-empty array`)
        else if (opt[mode].some((p) => typeof p !== 'string' || !p.trim())) err(id, `option ${i} ${mode} phrasings must be non-empty strings`)
      }
      // Isolation rule: practice and timed wordings must be disjoint.
      const pSet = new Set((opt?.practice ?? []).map((s) => s.trim().toLowerCase()))
      const shared = (opt?.timed ?? []).find((s) => pSet.has(s.trim().toLowerCase()))
      if (shared) err(id, `option ${i} shares wording across practice/timed: "${shared}"`)
    })
  }

  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) err(id, 'correctIndex must be an integer 0..3')
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) err(id, 'explanation required')
}

for (const d of DOMAINS) {
  if (perDomain[d] > BLUEPRINT[d]) err(d, `domain ${d}: ${perDomain[d]}/${BLUEPRINT[d]} (over blueprint)`)
  else if (perDomain[d] < BLUEPRINT[d]) {
    const msg = `domain ${d}: ${perDomain[d]}/${BLUEPRINT[d]} (incomplete)`
    if (requireComplete) err(d, msg)
    else warnings.push(msg)
  }
}

const total = QUESTIONS.length
const target = Object.values(BLUEPRINT).reduce((a, b) => a + b, 0)

console.log('--- Exam bank validation ---')
console.log('Per-domain:', DOMAINS.map((d) => `${d}:${perDomain[d]}/${BLUEPRINT[d]}`).join('  '))
console.log('Archetypes:', ARCHETYPES.map((a) => `${a}:${perArchetype[a]}`).join('  '))
console.log(`Total: ${total}/${target}`)
if (warnings.length) { console.log('\nWarnings:'); warnings.forEach((w) => console.log('  ! ' + w)) }
if (errors.length) {
  console.log(`\n${errors.length} ERROR(S):`)
  errors.forEach((e) => console.log('  x ' + e))
  process.exit(1)
}
console.log(total === target ? '\nOK - bank complete and valid.' : '\nStructurally valid; bank still incomplete.')
