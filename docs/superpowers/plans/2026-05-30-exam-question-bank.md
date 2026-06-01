# Exam Question Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the complete 60-question CCA-F × X-by-2 exam bank as a validated, server-only source file ready to load into Firestore.

**Architecture:** A single canonical ESM source file (`data/examQuestionBank.mjs`) holds all 60 questions in the agreed shape (shared stems, mode-separated answer wordings, `correctIndex`). A standalone Node validator (`data/validateBank.mjs`) enforces every spec invariant and is run after each domain as a quality gate. A small exporter (`data/exportFirestore.mjs`) emits a Firestore-import-ready JSON map. No application/runtime code is touched — Cloud Functions delivery and Firestore wiring are out of scope (see spec §8).

**Tech Stack:** Plain Node.js ESM (`.mjs`, run with `node` — no test framework, no build step). Content is markdown-free JS object literals.

**Spec:** `docs/superpowers/specs/2026-05-30-exam-question-bank-design.md` — read §3 (shape), §4 (archetypes), §5 (blueprint), §6 (isolation), §7 (exemplars) before authoring.

**Why `data/` at repo root:** Firebase Hosting deploys only `web/dist` and Functions deploys only `functions/`, so a repo-root `data/` directory ships to neither — correct home for a server-only source-of-truth seed that must never reach the browser bundle.

**Authoring rules (apply to every question):**
- `id` = `d{n}-{NNN}` (zero-padded, e.g. `d1-001`), unique, prefix matches `domain`.
- `topic` must be an exact string from that domain's list in `TOPICS`.
- `stem`: exactly 2 wordings (3 only for flagship questions). All wordings ask for the **same** answer.
- `options`: exactly 4. Each has `practice: [..]` and `timed: [..]`. **First-pass variance budget:** the **correct** option (at `correctIndex`) carries 2 practice + 1 timed phrasing; each **distractor** carries 1 practice + 2 timed phrasings. The practice and timed phrasing pools for a given option **must share no string** (the isolation rule the validator enforces).
- `correctIndex`: 0–3, points at the correct option in authoring order.
- Distractors are **named anti-patterns**, not nonsense (spec §4).
- `explanation`: one paragraph — why the correct option wins + why each distractor is a known anti-pattern.
- `dimensions`: `what-breaks`/`critique-output` → `["critical-eval"]` (+`"judgment"` when judgment is central); `tradeoff` → `["judgment"]`; `foundational` → `[]`.

---

## Task 1: Scaffold the source file and validator

**Files:**
- Create: `data/examQuestionBank.mjs`
- Create: `data/validateBank.mjs`

- [ ] **Step 1: Create the canonical source file with metadata and an empty bank**

`data/examQuestionBank.mjs`:

```js
// data/examQuestionBank.mjs
// Canonical source for the ctracer Practice Exam question bank.
// SERVER-ONLY content: loaded into Firestore (collection: exam_questions) and
// delivered via Cloud Functions. NEVER imported by web/ (answer-key isolation).
// Design: docs/superpowers/specs/2026-05-30-exam-question-bank-design.md

export const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 }

export const TOPICS = {
  d1: ['Multi-agent patterns', 'Agentic loops', 'Session management', 'Tool orchestration', 'Parallelization workflows', 'Chaining workflows', 'Routing workflows', 'Fallback loop design', 'Cost optimization'],
  d2: ['CLAUDE.md hierarchies', 'Custom slash commands', 'Agent Skills', 'Hooks', 'MCP server integration', 'GitHub integration', 'Context management', 'Claude Code SDK', 'Subagents', 'Tool access restrictions', 'Configuration files'],
  d3: ['System prompts', 'XML tags', 'Few-shot examples', 'Chain-of-thought', 'JSON schema enforcement', 'Structured output', 'Validation retry loops', 'Hallucination prevention', 'Failure modes', 'Prompt evaluation', 'Temperature & sampling', 'Prompt caching'],
  d4: ['Tool use fundamentals', 'Multi-tool systems', 'MCP architecture', 'MCP server building', 'MCP primitives', 'MCP client implementation', 'Static vs templated resources', 'MCP Server Inspector', 'Web search tool', 'Tool-use error handling', 'Tool selection'],
  d5: ['Context window limits', 'Model selection', 'Prompt caching', 'RAG fundamentals', 'Context discipline', 'Streaming responses', 'Rate limits & errors', 'Extended thinking', 'Image and PDF support', 'Citations', 'Files API & Code Execution', 'Output evaluation'],
}

// Populated domain-by-domain. Shape: see spec §3.
export const QUESTIONS = [
]
```

- [ ] **Step 2: Create the validator**

`data/validateBank.mjs`:

```js
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
```

- [ ] **Step 3: Run the validator against the empty bank**

Run: `node data/validateBank.mjs`
Expected: exit 0, prints `Total: 0/60`, a warning per domain (`incomplete`), no ERRORS.

- [ ] **Step 4: Commit**

```bash
git add data/examQuestionBank.mjs data/validateBank.mjs
git commit -m "chore: scaffold exam question bank source + validator"
```

---

## Task 2: Author Domain 1 — Agentic Architecture & Orchestration (16)

**Files:**
- Modify: `data/examQuestionBank.mjs` (append 16 entries to `QUESTIONS`)

**Allocation (covers all 9 D1 topics; judgment-weighted):**

| id | topic | archetype | difficulty | claudeSpecific |
|---|---|---|---|---|
| d1-001 | Multi-agent patterns | what-breaks | scenario | false |
| d1-002 | Multi-agent patterns | critique-output | hard | false |
| d1-003 | Agentic loops | what-breaks | scenario | false |
| d1-004 | Agentic loops | best-practice | core | false |
| d1-005 | Session management | what-breaks | scenario | false |
| d1-006 | Tool orchestration | what-breaks | scenario | false |
| d1-007 | Fallback loop design | what-breaks | scenario | false |
| d1-008 | Fallback loop design | critique-output | hard | false |
| d1-009 | Parallelization workflows | best-practice | scenario | false |
| d1-010 | Parallelization workflows | tradeoff | scenario | false |
| d1-011 | Chaining workflows | what-breaks | scenario | false |
| d1-012 | Routing workflows | best-practice | scenario | false |
| d1-013 | Routing workflows | tradeoff | scenario | false |
| d1-014 | Cost optimization | tradeoff | scenario | false |
| d1-015 | Cost optimization | critique-output | hard | false |
| d1-016 | Tool orchestration | foundational | core | false |

- [ ] **Step 1: Author d1-007 first as the pattern anchor (the spec §7 exemplar)**

Append this exact entry to `QUESTIONS` (it is the approved exemplar — use it verbatim as the quality/shape bar for the rest):

```js
  {
    id: 'd1-007', domain: 'd1', topic: 'Fallback loop design',
    archetype: 'what-breaks', difficulty: 'scenario',
    dimensions: ['critical-eval', 'judgment'], claudeSpecific: false,
    stem: [
      'An agent retries a failing tool call in a tight loop, re-issuing the identical call immediately until it succeeds. Under intermittent API failures, some sessions run away on cost and never terminate. What should the design add?',
      "A team's agent handles a flaky API by immediately re-calling it on every failure with no other change. Some sessions hang and rack up cost. Which change best fixes this?",
    ],
    correctIndex: 0,
    options: [
      { practice: ['Add bounded retries with exponential backoff and an escape hatch that exits after N attempts.', 'Cap retries with backoff plus a fallback path once the attempt limit is hit.'],
        timed: ['Introduce a retry ceiling with exponential backoff and a defined exit/fallback when the ceiling is reached.', 'Bound the loop: limited retries, increasing delay, and a terminal fallback branch.'] },
      { practice: ['Switch every step to the highest-capability model so calls fail less often.'],
        timed: ['Route all steps to the top model tier to reduce failure frequency.'] },
      { practice: ['Remove the loop and call the tool once, failing the whole task on any error.'],
        timed: ['Drop retries entirely and abort the task on the first failure.'] },
      { practice: ['Wrap the same immediate-retry loop in a parallel agent to amortize cost.'],
        timed: ['Parallelize the existing no-backoff loop across agents to spread the load.'] },
    ],
    explanation: 'Domain 1 fallback-loop design: bounded retries + backoff + an escape hatch. The distractors are anti-patterns an AI assistant tends to generate - top-tier-everywhere (cost, does not fix non-termination), brittle no-retry over-correction, and parallelizing a broken loop. Catching the missing escape hatch is the critical-evaluation signal.',
  },
```

- [ ] **Step 2: Author the remaining 15 D1 entries**

Write d1-001 through d1-016 (excluding d1-007 already done) following the allocation table and the authoring rules in the plan header. Each entry matches the d1-007 shape exactly. Keep distractors as named agentic anti-patterns (e.g. no escape hatch, shared mutable session state across parallel agents, unbounded fan-out, wrong-tier model everywhere, sequential where parallel was free, routing on no signal). Ensure practice/timed phrasings are disjoint per option.

- [ ] **Step 3: Run the validator**

Run: `node data/validateBank.mjs`
Expected: exit 0; `d1:16/16`; warnings only for d2–d5 incomplete; **zero ERRORS**. If any error prints, fix the offending entry and re-run until clean.

- [ ] **Step 4: REVIEW GATE — stop and present D1 to the user**

Print the 16 D1 questions (stems, options, correct answer, explanation) for the user to review tone, difficulty, and distractor quality. Do NOT proceed to D2 until the user approves or requests changes. If changes are requested, apply them, re-run the validator, and re-present.

- [ ] **Step 5: Commit**

```bash
git add data/examQuestionBank.mjs
git commit -m "content: author Domain 1 exam questions (agentic architecture)"
```

---

## Task 3: Author Domain 2 — Claude Code Configuration & Workflows (12)

**Files:**
- Modify: `data/examQuestionBank.mjs`

**Allocation (all 11 D2 topics; all `claudeSpecific: true`):**

| id | topic | archetype | difficulty |
|---|---|---|---|
| d2-001 | CLAUDE.md hierarchies | what-breaks | scenario |
| d2-002 | Custom slash commands | best-practice | core |
| d2-003 | Agent Skills | best-practice | scenario |
| d2-004 | Hooks | what-breaks | scenario |
| d2-005 | MCP server integration | critique-output | scenario |
| d2-006 | GitHub integration | best-practice | scenario |
| d2-007 | Context management | what-breaks | scenario |
| d2-008 | Claude Code SDK | foundational | core |
| d2-009 | Subagents | what-breaks | scenario |
| d2-010 | Tool access restrictions | critique-output | scenario |
| d2-011 | Configuration files | best-practice | core |
| d2-012 | Context management | critique-output | hard |

- [ ] **Step 1: Author d2-004 first as the D2 anchor (spec §7 exemplar)**

Append the approved D2 exemplar verbatim:

```js
  {
    id: 'd2-004', domain: 'd2', topic: 'Hooks',
    archetype: 'what-breaks', difficulty: 'scenario',
    dimensions: ['critical-eval', 'judgment'], claudeSpecific: true,
    stem: [
      "To 'catch regressions early,' an engineer adds a PreToolUse hook that runs the full test suite before every file edit. Sessions become unusably slow. What is the better design?",
      "A team's PreToolUse hook executes the entire test suite ahead of each edit, grinding sessions to a halt. How should this be restructured?",
    ],
    correctIndex: 0,
    options: [
      { practice: ['Move full-suite testing to a PostToolUse or Stop hook (or CI), and keep PreToolUse checks fast and targeted.', 'Run the suite after edits / at session stop or in CI; reserve PreToolUse for cheap, scoped validation.'],
        timed: ['Relocate the heavy test run to a post-edit or stop-time hook (or the CI pipeline) and limit pre-edit hooks to quick, narrow checks.', 'Keep pre-edit hooks lightweight; defer the comprehensive suite to a Stop hook or continuous integration.'] },
      { practice: ['Keep the hook but disable tests that are slow.'],
        timed: ['Leave the PreToolUse hook and just turn off the slower tests.'] },
      { practice: ['Replace the hook with a CLAUDE.md instruction telling the model to run tests.'],
        timed: ['Drop the hook and add a CLAUDE.md note asking the model to test before editing.'] },
      { practice: ['Increase the hook timeout so the suite has time to finish.'],
        timed: ["Raise the hook's timeout to let the full suite complete each time."] },
    ],
    explanation: 'Hooks that block every tool call must be fast and targeted; full suites belong in PostToolUse/Stop hooks or CI. Disabling tests trades safety for speed; a CLAUDE.md instruction is advisory not enforced; a longer timeout keeps the latency. Recognizing that the hook trigger point is the flaw is the judgment signal.',
  },
```

- [ ] **Step 2: Author the remaining 11 D2 entries** per the allocation table and authoring rules. Set `claudeSpecific: true` on all D2 entries. Distractors = real Claude Code anti-patterns (dumping everything in one giant CLAUDE.md, over-broad tool permissions on a skill/subagent, never `/clear`-ing context, putting secrets in committed config, etc.).
- [ ] **Step 3: Run the validator** — Run: `node data/validateBank.mjs`; Expected: `d1:16/16 d2:12/12`, zero ERRORS.
- [ ] **Step 4: REVIEW GATE** — present D2 to the user; wait for approval before D3.
- [ ] **Step 5: Commit**

```bash
git add data/examQuestionBank.mjs
git commit -m "content: author Domain 2 exam questions (Claude Code config)"
```

---

## Task 4: Author Domain 3 — Prompt Engineering & Structured Output (12)

**Files:**
- Modify: `data/examQuestionBank.mjs`

**Allocation (all 12 D3 topics, one each):**

| id | topic | archetype | difficulty | claudeSpecific |
|---|---|---|---|---|
| d3-001 | System prompts | critique-output | scenario | false |
| d3-002 | XML tags | best-practice | core | true |
| d3-003 | Few-shot examples | best-practice | scenario | false |
| d3-004 | Chain-of-thought | what-breaks | scenario | false |
| d3-005 | Failure modes | what-breaks | scenario | false |
| d3-006 | JSON schema enforcement | critique-output | scenario | false |
| d3-007 | Structured output | best-practice | scenario | false |
| d3-008 | Validation retry loops | what-breaks | scenario | false |
| d3-009 | Hallucination prevention | critique-output | hard | false |
| d3-010 | Prompt evaluation | critique-output | scenario | false |
| d3-011 | Temperature & sampling | what-breaks | core | false |
| d3-012 | Prompt caching | foundational | core | true |

- [ ] **Step 1: Author d3-006 first as the D3 anchor (spec §7 exemplar)**

Append the approved D3 exemplar verbatim:

```js
  {
    id: 'd3-006', domain: 'd3', topic: 'JSON schema enforcement',
    archetype: 'critique-output', difficulty: 'scenario',
    dimensions: ['critical-eval'], claudeSpecific: false,
    stem: [
      "A prompt instructs the model to 'respond in JSON,' but parsing fails for ~15% of production responses. Which change most reliably fixes it?",
      "In production, ~15% of responses to a 'return JSON' prompt fail to parse. What is the most dependable fix?",
    ],
    correctIndex: 0,
    options: [
      { practice: ['Constrain output with a schema (tool/structured output) and add a validation-and-retry loop on parse failure.', 'Enforce a JSON schema and re-prompt automatically when validation fails.'],
        timed: ['Bind the response to a typed schema via structured output and retry on validation errors.', 'Use schema-constrained output plus an automatic re-ask when the parse check fails.'] },
      { practice: ['Raise the temperature so the model is more flexible about format.'],
        timed: ['Increase sampling temperature to loosen the formatting.'] },
      { practice: ["Add 'please return valid JSON, this is important' to the prompt."],
        timed: ['Append a stronger plea for valid JSON to the instructions.'] },
      { practice: ['Make the prompt much longer with more prose explanation.'],
        timed: ['Expand the prompt with additional descriptive prose.'] },
    ],
    explanation: 'Reliable structured output comes from schema enforcement + a validation/retry loop, not from politer or longer prompts. Higher temperature makes format less reliable. The question rewards reading the proposed fixes critically - three are superstition, one is engineering.',
  },
```

- [ ] **Step 2: Author the remaining 11 D3 entries** per the allocation table. Several `critique-output` items should show a flawed prompt/spec and ask what is wrong. Distractors = prompt-engineering superstitions (raise temperature for reliability, "be more emphatic," dump more context, skip evals and eyeball it, no schema/grounding).
- [ ] **Step 3: Run the validator** — Expected: `d3:12/12`, zero ERRORS.
- [ ] **Step 4: REVIEW GATE** — present D3; wait for approval.
- [ ] **Step 5: Commit**

```bash
git add data/examQuestionBank.mjs
git commit -m "content: author Domain 3 exam questions (prompt engineering)"
```

---

## Task 5: Author Domain 4 — Tool Design & MCP Integration (11)

**Files:**
- Modify: `data/examQuestionBank.mjs`

**Allocation (all 11 D4 topics, one each):**

| id | topic | archetype | difficulty | claudeSpecific |
|---|---|---|---|---|
| d4-001 | Tool use fundamentals | best-practice | core | true |
| d4-002 | Multi-tool systems | what-breaks | scenario | true |
| d4-003 | MCP architecture | foundational | core | true |
| d4-004 | MCP server building | critique-output | scenario | true |
| d4-005 | MCP primitives | foundational | core | true |
| d4-006 | MCP client implementation | what-breaks | scenario | true |
| d4-007 | Static vs templated resources | best-practice | scenario | true |
| d4-008 | MCP Server Inspector | foundational | core | true |
| d4-009 | Web search tool | critique-output | scenario | true |
| d4-010 | Tool-use error handling | what-breaks | scenario | false |
| d4-011 | Tool selection | tradeoff | scenario | false |

- [ ] **Step 1: Author d4-005 first as the D4 anchor (spec §7 exemplar)**

Append the approved D4 exemplar verbatim:

```js
  {
    id: 'd4-005', domain: 'd4', topic: 'MCP primitives',
    archetype: 'foundational', difficulty: 'core',
    dimensions: [], claudeSpecific: true,
    stem: [
      "You want Claude to read a config file's contents on demand but never modify it, and the host app controls when it's available. Which MCP primitive fits?",
      'Which MCP primitive exposes read-only, app-controlled data that Claude can pull in but not change?',
    ],
    correctIndex: 0,
    options: [
      { practice: ['A Resource (app-controlled, read-only data).', 'An MCP Resource - read-only, controlled by the app.'],
        timed: ['A Resource - application-controlled, read-only context.', 'The Resource primitive (read-only, host-governed).'] },
      { practice: ['A Tool (model-controlled action).'],
        timed: ['A Tool - a model-invoked action.'] },
      { practice: ['A Prompt (user-controlled template).'],
        timed: ['A Prompt - a user-selected template.'] },
      { practice: ['A Sampling request back to the client.'],
        timed: ['A client-side Sampling callback.'] },
    ],
    explanation: 'MCP Resources are app-controlled, read-only data Claude can access. Tools are model-controlled actions (would allow modification); Prompts are user-controlled templates; Sampling is the server asking the client to run a completion. Clean primitive recall - capped foundational coverage.',
  },
```

- [ ] **Step 2: Author the remaining 10 D4 entries** per the allocation table. `claudeSpecific: true` for all MCP/Claude-tooling items; `false` for the two tool-agnostic items (d4-010 error handling, d4-011 selection). Distractors = tool/MCP anti-patterns (one mega-tool instead of focused tools, vague tool descriptions/schemas, Tool where a Resource belongs, swallowing tool errors instead of returning them to the model, RAG-everything when a tool call is correct).
- [ ] **Step 3: Run the validator** — Expected: `d4:11/11`, zero ERRORS.
- [ ] **Step 4: REVIEW GATE** — present D4; wait for approval.
- [ ] **Step 5: Commit**

```bash
git add data/examQuestionBank.mjs
git commit -m "content: author Domain 4 exam questions (tool design & MCP)"
```

---

## Task 6: Author Domain 5 — Context Management & Reliability (9)

**Files:**
- Modify: `data/examQuestionBank.mjs`

**Allocation (9 of 12 D5 topics):**

| id | topic | archetype | difficulty | claudeSpecific |
|---|---|---|---|---|
| d5-001 | Context window limits | what-breaks | scenario | false |
| d5-002 | Model selection | tradeoff | scenario | false |
| d5-003 | Prompt caching | tradeoff | scenario | true |
| d5-004 | RAG fundamentals | what-breaks | scenario | false |
| d5-005 | Context discipline | best-practice | scenario | false |
| d5-006 | Rate limits & errors | what-breaks | scenario | false |
| d5-007 | Streaming responses | best-practice | core | false |
| d5-008 | Extended thinking | tradeoff | scenario | true |
| d5-009 | Output evaluation | critique-output | hard | false |

- [ ] **Step 1: Author d5-003 first as the D5 anchor (spec §7 exemplar)**

Append the approved D5 exemplar verbatim:

```js
  {
    id: 'd5-003', domain: 'd5', topic: 'Prompt caching',
    archetype: 'tradeoff', difficulty: 'scenario',
    dimensions: ['judgment'], claudeSpecific: true,
    stem: [
      'A pipeline resends a 40-page policy document as context on every one of thousands of calls. Latency and cost are high; the document rarely changes. What is the best fix?',
      'Thousands of calls each prepend the same large, rarely-changing document. Cost and latency are the complaint. Which change helps most?',
    ],
    correctIndex: 0,
    options: [
      { practice: ['Apply prompt caching (cache_control) to the static document prefix so it is not reprocessed each call.', 'Mark the unchanging prefix with a cache breakpoint to reuse it across calls.'],
        timed: ['Set a cache_control breakpoint on the stable prefix so repeated context is served from cache.', 'Cache the static portion via cache_control to avoid reprocessing it every request.'] },
      { practice: ['Switch the whole pipeline to the smallest model to cut cost.'],
        timed: ['Move everything to the cheapest model tier.'] },
      { practice: ['Truncate the document to its first page on every call.'],
        timed: ['Send only the first page of the document each time.'] },
      { practice: ['Request a rate-limit increase to push more calls through.'],
        timed: ['Ask for higher rate limits to raise throughput.'] },
    ],
    explanation: 'A large, static, frequently-reused prefix is the textbook prompt-caching case - cache_control cuts latency and cost without losing context. Downgrading the model risks quality, truncation loses information, and a rate-limit bump addresses throughput not the per-call waste. Judgment: match the fix to the actual cost driver.',
  },
```

- [ ] **Step 2: Author the remaining 8 D5 entries** per the allocation table. Distractors = reliability anti-patterns (ignore the context limit and let it silently truncate, no backoff on 429/529, chunk-free RAG / no reranking, stream without handling partial failures, extended thinking on trivial calls, ship without an eval harness).
- [ ] **Step 3: Run the validator (full completeness gate)** — Run: `node data/validateBank.mjs --complete`; Expected: `Total: 60/60`, **no warnings, no ERRORS**, prints `OK - bank complete and valid.`
- [ ] **Step 4: REVIEW GATE** — present D5; wait for approval.
- [ ] **Step 5: Commit**

```bash
git add data/examQuestionBank.mjs
git commit -m "content: author Domain 5 exam questions (context & reliability)"
```

---

## Task 7: Final coverage pass + Firestore export

**Files:**
- Create: `data/exportFirestore.mjs`
- Create (generated): `data/exam-question-bank.firestore.json`

- [ ] **Step 1: Full validation must be green**

Run: `node data/validateBank.mjs --complete`
Expected: `Total: 60/60`, zero warnings, zero ERRORS. Review the printed `Archetypes:` line against spec §5 targets (what-breaks ≈18, critique-output ≈15, best-practice ≈12, tradeoff ≈9, foundational ≈6). These are soft targets — note any large deviation for the user but do not fail on it.

- [ ] **Step 2: Write the Firestore exporter**

`data/exportFirestore.mjs`:

```js
// data/exportFirestore.mjs
// Emits a Firestore-import-ready map (docId -> fields) for collection exam_questions.
// Run: node data/exportFirestore.mjs
import { writeFileSync } from 'node:fs'
import { QUESTIONS } from './examQuestionBank.mjs'

const map = {}
for (const q of QUESTIONS) {
  const { id, ...fields } = q
  map[id] = fields
}
const out = new URL('./exam-question-bank.firestore.json', import.meta.url)
writeFileSync(out, JSON.stringify(map, null, 2) + '\n')
console.log(`Wrote ${Object.keys(map).length} docs to ${out.pathname}`)
```

- [ ] **Step 3: Generate the JSON**

Run: `node data/exportFirestore.mjs`
Expected: prints `Wrote 60 docs to .../exam-question-bank.firestore.json`.

- [ ] **Step 4: Spot-check the JSON** — open `data/exam-question-bank.firestore.json`; confirm it is an object keyed by `d1-001`…`d5-009`, each value carrying `domain`, `stem`, `options` (with `practice`/`timed`), `correctIndex`, `explanation`, and tags. The `id` is the key, not duplicated inside the value.

- [ ] **Step 5: Commit**

```bash
git add data/exportFirestore.mjs data/exam-question-bank.firestore.json
git commit -m "content: add Firestore exporter + generated import file for exam bank"
```

---

## Out of scope (do NOT do in this plan)

Per spec §8, all of the following are deferred to a separate plan: the Cloud Functions that read `exam_questions` / build sessions / sanitize per mode / reveal answers; Firestore security rules for the collection; web client changes to fetch via functions; removal of the placeholder banks (`web/src/data/practiceQuestions.js`, `functions/practiceBank.js`); the actual Firestore import run; any admin UI.

---

## Self-Review (completed by plan author)

- **Spec coverage:** shape §3 → Task 1 (`TOPICS`/`BLUEPRINT`) + entry shape in every authoring task; archetypes §4 → allocation tables; blueprint §5 → per-domain Tasks 2–6 with exact counts (16/12/12/11/9) + validator enforces; isolation §6 → validator practice/timed disjointness check + `claudeSpecific` flag set per allocation + answer key never in `web/`; exemplars §7 → embedded verbatim as anchors in Tasks 2–6; out-of-scope §8 → dedicated section. Covered.
- **Placeholder scan:** validator and exporter code are complete; exemplar entries are complete; the 51 non-exemplar questions are specified by allocation table + authoring rules (their concrete text is the execution deliverable, intentionally produced during execution and gated by the validator + review).
- **Type consistency:** field names (`correctIndex`, `options[].practice`/`.timed`, `dimensions`, `claudeSpecific`) match across spec, validator, exemplars, and exporter. Enum values match the validator's allowed sets.
