# Exam Question Bank — Design Spec

**Date:** 2026-05-30
**Status:** Design approved; authoring not yet started
**Owner:** Mohammed Hussain
**Scope of this document:** the *content* (questions/answers) and the *Firestore data shape*. Retrieval/wiring implementation is explicitly **out of scope** here and tracked separately.

---

## 1. Purpose

Produce one authoritative set of exam questions for the ctracer Practice Exam that serves **two goals at once**:

1. **CCA-F certification prep** — faithful to the Claude Certified Architect – Foundations exam: 60 questions, scenario-based, five weighted domains.
2. **X by 2 candidate assessment** — a usable signal on the "Tech Lead, AI-Accelerated" Round 3 rubric, especially the must-hit dimension **#3 Critical Evaluation of AI output** and **#5 Engineering Judgment**.

### The marriage, stated plainly

A multiple-choice exam can authentically test only **2 of the 5** AI-fluency rubric dimensions — *critical evaluation* and *engineering judgment*. The other three (problem framing, prompt craft, codebase exploration) are behavioral and require the live "driving test," not a bubble. So we do not force every question to serve both masters. Instead we **lean the question style into the genuine overlap**: scenario questions of the form *"here is an AI-generated design/output — what breaks, and what would you push back on?"* are simultaneously valid CCA-F prep **and** a clean read on rubric #3/#5.

The CCA-F framework is the backbone. The interview rubric will be evolved toward these dimensions over time rather than the questions being bent to fit two separate frameworks. Claude-specific content stays; non-Claude candidates can still take the exam, and Claude-specifics are weighted separately at evaluation time (see the `claudeSpecific` flag).

---

## 2. Decisions locked (with rationale)

| Decision | Choice | Why |
|---|---|---|
| Bank model | **One unified bank** | One set to maintain; cert framework is a reasonable shared backbone. |
| Bank size | **Fixed 60 questions** | Matches the real exam blueprint; fewer objects to hand-maintain. |
| Anti-memorization | **Variance built into each question** | Multiple stem wordings + multiple answer phrasings + option-order shuffle make the wording/phrasing/order combinatorial space large, so "retake until you've seen everything" is hard — without a larger pool to author. |
| Storage | **Server-only Firestore collection**, delivered via Cloud Functions | One editable doc per question; Firestore rules deny client reads; functions sanitize and deliver. Preserves answer-key isolation while keeping a single bank. |
| Question style | **Judgment-weighted** | Full domain coverage, but over-index on `what-breaks` and `critique-output` archetypes — the cert × interview overlap. |
| Practice vs timed | **Shared stems, mode-separated answer wordings** | A candidate who studies practice mode memorizes practice phrasings that never appear in timed mode, so recognition does not transfer. |
| Answer key field | **`correctIndex`** (not a per-option boolean) | One field, cleaner to hand-edit, friendlier to a future admin UI. |
| Editing | **Manual via Firestore console** for now | No admin UI required yet; shape chosen to make one possible later. |

---

## 3. Firestore data shape

One server-only collection (working name **`exam_questions`**), one document per question. Firestore rules **deny all client reads and writes**; only Cloud Functions (Admin SDK) read it. Functions sanitize per mode before delivery and reveal the answer key only at the right moment (practice: per question after answering; timed: at submit).

```js
{
  id: "d1-007",                        // stable, human-readable; also the doc id
  domain: "d1",                        // "d1" | "d2" | "d3" | "d4" | "d5"
  topic: "Fallback loop design",       // from the domain's topic list (section 5)
  archetype: "what-breaks",            // see section 4
  difficulty: "scenario",              // "core" | "scenario" | "hard"
  dimensions: ["critical-eval", "judgment"],  // AI-fluency dims surfaced; [] for pure recall
  claudeSpecific: false,               // true = Claude-only content (for candidate weighting)

  stem: [                              // SHARED by both modes; authored once
    "wording 1 …",
    "wording 2 …"
  ],

  correctIndex: 0,                     // index into options[]; exactly one correct

  options: [                           // exactly 4 options, authoring order
    {
      practice: ["phrasing A", "phrasing B"],   // shown ONLY in practice mode
      timed:    ["phrasing C", "phrasing D"]     // shown ONLY in timed mode; deliberately distinct
    },
    { practice: ["…"], timed: ["…"] },
    { practice: ["…"], timed: ["…"] },
    { practice: ["…"], timed: ["…"] }
  ],

  explanation: "why correctIndex wins + why each distractor is a named anti-pattern",
  updatedAt: <serverTimestamp>
}
```

### Field reference

- **`id`** — `d{n}-{seq}`, e.g. `d3-004`. Stable across edits; used as the Firestore doc id.
- **`domain`** — one of `d1`…`d5`.
- **`topic`** — must match a name in that domain's topic list (section 5). Used for per-topic coverage checks.
- **`archetype`** — the question's shape (section 4). Drives the blueprint mix.
- **`difficulty`** — `core` (recall / single-concept), `scenario` (apply to a described situation), `hard` (multi-factor "what breaks" / subtle critique).
- **`dimensions`** — subset of `["critical-eval", "judgment", "framing"]`. Pure-recall questions use `[]`.
- **`claudeSpecific`** — `true` when correctness depends on Claude/Anthropic-specific knowledge (e.g. `cache_control`, CLAUDE.md, MCP). Lets candidate evaluation discount these for non-Claude-tool backgrounds.
- **`stem`** — array of 2 interchangeable wordings (3 for flagship questions). All wordings must ask for the **same** answer.
- **`correctIndex`** — index into `options` (authoring order). The delivery function shuffles display order and tracks the mapping for scoring.
- **`options`** — exactly 4. Each option carries a `practice` and a `timed` array of equivalent phrasings (~2 each). The two pools must be **distinct wordings of the same meaning**.
- **`explanation`** — shared across modes; revealed only after answering, so it cannot leak a timed answer during the exam.

### Compatibility with existing code

The shape maps cleanly onto the current `buildSession` / `scoreSession` machinery: `stemIdx` selects from `stem[]`, `phraseIdx` selects from the mode's phrasing pool, `optOrder` shuffles display order, and `correctOrigIdx` is derived from `correctIndex`. Moving the source from the in-code banks to Firestore is a source swap, not a rewrite — but that work is **out of scope for this spec**.

---

## 4. Archetypes

| Archetype | Shape | Primary dimensions | Notes |
|---|---|---|---|
| `what-breaks` | A described setup has a latent flaw; pick the fix or the root cause. | critical-eval, judgment | Heaviest archetype. The cert × interview sweet spot. |
| `critique-output` | An AI-generated artifact (prompt, plan, code, PR) is shown; identify what's wrong / what to push back on. | critical-eval | Most directly mirrors the rubric's must-hit dimension. |
| `best-practice` | Choose the recommended pattern for a stated goal. | judgment (sometimes) | Cert-faithful; some are near-recall. |
| `tradeoff` | Competing constraints (cost / latency / capability / clarity); pick the best-balanced call. | judgment | Surfaces engineering judgment under leverage. |
| `foundational` | Definitional / single-concept recall, often Claude-specific. | — (`[]`) | Keeps the exam honest as cert prep; capped at ~10%. |

**Distractor discipline (applies to every archetype):** distractors should be *named anti-patterns*, not obvious nonsense — e.g. "use the top-tier model everywhere," "retry with no backoff," "cram all context into one prompt," "skip validation and trust the first response." This is what makes a question discriminate a real practitioner from someone pattern-matching surface keywords.

---

## 5. Content blueprint

### Per-domain counts (CCA-F weighting, total 60)

| Domain | Weight | Count | Topic pool (one source of `topic` values) |
|---|---|---|---|
| D1 — Agentic Architecture & Orchestration | 27% | **16** | Multi-agent patterns, Agentic loops, Session management, Tool orchestration, Parallelization, Chaining, Routing, Fallback loop design, Cost optimization |
| D2 — Claude Code Configuration & Workflows | 20% | **12** | CLAUDE.md hierarchies, Custom slash commands, Agent Skills, Hooks, MCP server integration, GitHub integration, Context management, Claude Code SDK, Subagents, Tool access restrictions, Configuration files |
| D3 — Prompt Engineering & Structured Output | 20% | **12** | System prompts, XML tags, Few-shot examples, Chain-of-thought, JSON schema enforcement, Structured output, Validation retry loops, Hallucination prevention, Failure modes, Prompt evaluation, Temperature & sampling, Prompt caching |
| D4 — Tool Design & MCP Integration | 18% | **11** | Tool use fundamentals, Multi-tool systems, MCP architecture, MCP server building, MCP primitives, MCP client implementation, Static vs templated resources, MCP Server Inspector, Web search tool, Tool-use error handling, Tool selection |
| D5 — Context Management & Reliability | 15% | **9** | Context window limits, Model selection, Prompt caching, RAG fundamentals, Context discipline, Streaming responses, Rate limits & errors, Extended thinking, Image/PDF support, Citations, Files API & Code Execution, Output evaluation |

### Archetype distribution (judgment-weighted, ~60)

Target mix across the whole bank (per-domain skew in parentheses):

- `what-breaks` ≈ **18** (heavy in D1, D3, D5)
- `critique-output` ≈ **15** (heavy in D2, D3)
- `best-practice` ≈ **12** (even; heavier in D4)
- `tradeoff` ≈ **9** (heavy in D5, D1 cost)
- `foundational` ≈ **6** (light, spread; D4 MCP primitives, D5 limits)

These are targets, not quotas — coverage of every domain's topics comes first, then we balance the archetype mix.

### Variance budget per question

- **2** stem wordings (3 for flagship questions).
- **~2** phrasings per option per mode (so each option has ~2 practice + ~2 timed phrasings).
- Option display order shuffled at render.

---

## 6. Answer-key isolation guarantees

1. The entire `exam_questions` collection is **server-only** — Firestore rules deny client reads; the answer key never enters the web bundle or a client query.
2. **Practice and timed answer wordings are disjoint.** Memorizing practice phrasings does not let a candidate recognize the correct option in timed mode.
3. **Timed answers + explanations are revealed only at submit**, server-side, using the timed phrasing pool.
4. `correctIndex` is stripped from any client-bound payload; display-order mapping for scoring stays server-side.

---

## 7. Worked exemplars (one per domain)

These are authoring templates — they set the tone, difficulty, and distractor discipline. Phrasing pools shown abbreviated (`timed` wordings deliberately distinct from `practice`).

### D1 — `what-breaks` — Fallback loop design

```js
{
  id: "d1-007", domain: "d1", topic: "Fallback loop design",
  archetype: "what-breaks", difficulty: "scenario",
  dimensions: ["critical-eval", "judgment"], claudeSpecific: false,
  stem: [
    "An agent retries a failing tool call in a tight loop, re-issuing the identical call immediately until it succeeds. Under intermittent API failures, some sessions run away on cost and never terminate. What should the design add?",
    "A team's agent handles a flaky API by immediately re-calling it on every failure with no other change. Some sessions hang and rack up cost. Which change best fixes this?"
  ],
  correctIndex: 0,
  options: [
    { practice: ["Add bounded retries with exponential backoff and an escape hatch that exits after N attempts.",
                 "Cap retries with backoff plus a fallback path once the attempt limit is hit."],
      timed:    ["Introduce a retry ceiling with exponential backoff and a defined exit/fallback when the ceiling is reached.",
                 "Bound the loop: limited retries, increasing delay, and a terminal fallback branch."] },
    { practice: ["Switch every step to the highest-capability model so calls fail less often."],
      timed:    ["Route all steps to the top model tier to reduce failure frequency."] },
    { practice: ["Remove the loop and call the tool once, failing the whole task on any error."],
      timed:    ["Drop retries entirely and abort the task on the first failure."] },
    { practice: ["Wrap the same immediate-retry loop in a parallel agent to amortize cost."],
      timed:    ["Parallelize the existing no-backoff loop across agents to spread the load."] }
  ],
  explanation: "Domain 1 fallback-loop design: bounded retries + backoff + an escape hatch. The distractors are the anti-patterns an AI assistant tends to *generate* — top-tier-everywhere (cost, doesn't fix non-termination), brittle no-retry over-correction, and parallelizing a broken loop. Catching the missing escape hatch is the critical-evaluation signal."
}
```

### D2 — `what-breaks` — Hooks (Claude-specific)

```js
{
  id: "d2-004", domain: "d2", topic: "Hooks",
  archetype: "what-breaks", difficulty: "scenario",
  dimensions: ["critical-eval", "judgment"], claudeSpecific: true,
  stem: [
    "To 'catch regressions early,' an engineer adds a PreToolUse hook that runs the full test suite before every file edit. Sessions become unusably slow. What is the better design?",
    "A team's PreToolUse hook executes the entire test suite ahead of each edit, grinding sessions to a halt. How should this be restructured?"
  ],
  correctIndex: 0,
  options: [
    { practice: ["Move full-suite testing to a PostToolUse or Stop hook (or CI), and keep PreToolUse checks fast and targeted.",
                 "Run the suite after edits / at session stop or in CI; reserve PreToolUse for cheap, scoped validation."],
      timed:    ["Relocate the heavy test run to a post-edit or stop-time hook (or the CI pipeline) and limit pre-edit hooks to quick, narrow checks.",
                 "Keep pre-edit hooks lightweight; defer the comprehensive suite to a Stop hook or continuous integration."] },
    { practice: ["Keep the hook but disable tests that are slow."],
      timed:    ["Leave the PreToolUse hook and just turn off the slower tests."] },
    { practice: ["Replace the hook with a CLAUDE.md instruction telling the model to run tests."],
      timed:    ["Drop the hook and add a CLAUDE.md note asking the model to test before editing."] },
    { practice: ["Increase the hook timeout so the suite has time to finish."],
      timed:    ["Raise the hook's timeout to let the full suite complete each time."] }
  ],
  explanation: "Hooks that block every tool call must be fast and targeted; full suites belong in PostToolUse/Stop hooks or CI. Disabling tests trades safety for speed; a CLAUDE.md instruction is advisory, not enforced; a longer timeout keeps the latency. Recognizing that a hook's *trigger point* is the flaw is the judgment signal."
}
```

### D3 — `critique-output` — JSON schema enforcement

```js
{
  id: "d3-006", domain: "d3", topic: "JSON schema enforcement",
  archetype: "critique-output", difficulty: "scenario",
  dimensions: ["critical-eval"], claudeSpecific: false,
  stem: [
    "A prompt instructs the model to 'respond in JSON,' but parsing fails for ~15% of production responses. Which change most reliably fixes it?",
    "In production, ~15% of responses to a 'return JSON' prompt fail to parse. What is the most dependable fix?"
  ],
  correctIndex: 0,
  options: [
    { practice: ["Constrain output with a schema (tool/structured output) and add a validation-and-retry loop on parse failure.",
                 "Enforce a JSON schema and re-prompt automatically when validation fails."],
      timed:    ["Bind the response to a typed schema via structured output and retry on validation errors.",
                 "Use schema-constrained output plus an automatic re-ask when the parse check fails."] },
    { practice: ["Raise the temperature so the model is more flexible about format."],
      timed:    ["Increase sampling temperature to loosen the formatting."] },
    { practice: ["Add 'please return valid JSON, this is important' to the prompt."],
      timed:    ["Append a stronger plea for valid JSON to the instructions."] },
    { practice: ["Make the prompt much longer with more prose explanation."],
      timed:    ["Expand the prompt with additional descriptive prose."] }
  ],
  explanation: "Reliable structured output comes from schema enforcement + a validation/retry loop, not from politer or longer prompts. Higher temperature makes format *less* reliable. This question rewards reading the proposed 'fixes' critically — three are superstition, one is engineering."
}
```

### D4 — `foundational` — MCP primitives (Claude-specific)

```js
{
  id: "d4-005", domain: "d4", topic: "MCP primitives",
  archetype: "foundational", difficulty: "core",
  dimensions: [], claudeSpecific: true,
  stem: [
    "You want Claude to read a config file's contents on demand but never modify it, and the host app controls when it's available. Which MCP primitive fits?",
    "Which MCP primitive exposes read-only, app-controlled data that Claude can pull in but not change?"
  ],
  correctIndex: 0,
  options: [
    { practice: ["A Resource (app-controlled, read-only data).", "An MCP Resource — read-only, controlled by the app."],
      timed:    ["A Resource — application-controlled, read-only context.", "The Resource primitive (read-only, host-governed)."] },
    { practice: ["A Tool (model-controlled action)."], timed: ["A Tool — a model-invoked action."] },
    { practice: ["A Prompt (user-controlled template)."], timed: ["A Prompt — a user-selected template."] },
    { practice: ["A Sampling request back to the client."], timed: ["A client-side Sampling callback."] }
  ],
  explanation: "MCP Resources are app-controlled, read-only data Claude can access. Tools are model-controlled actions (would allow modification); Prompts are user-controlled templates; Sampling is the server asking the client to run a completion. Clean primitive recall — capped foundational coverage."
}
```

### D5 — `tradeoff` — Prompt caching (Claude-specific)

```js
{
  id: "d5-003", domain: "d5", topic: "Prompt caching",
  archetype: "tradeoff", difficulty: "scenario",
  dimensions: ["judgment"], claudeSpecific: true,
  stem: [
    "A pipeline resends a 40-page policy document as context on every one of thousands of calls. Latency and cost are high; the document rarely changes. What is the best fix?",
    "Thousands of calls each prepend the same large, rarely-changing document. Cost and latency are the complaint. Which change helps most?"
  ],
  correctIndex: 0,
  options: [
    { practice: ["Apply prompt caching (cache_control) to the static document prefix so it isn't reprocessed each call.",
                 "Mark the unchanging prefix with a cache breakpoint to reuse it across calls."],
      timed:    ["Set a cache_control breakpoint on the stable prefix so repeated context is served from cache.",
                 "Cache the static portion via cache_control to avoid reprocessing it every request."] },
    { practice: ["Switch the whole pipeline to the smallest model to cut cost."],
      timed:    ["Move everything to the cheapest model tier."] },
    { practice: ["Truncate the document to its first page on every call."],
      timed:    ["Send only the first page of the document each time."] },
    { practice: ["Request a rate-limit increase to push more calls through."],
      timed:    ["Ask for higher rate limits to raise throughput."] }
  ],
  explanation: "A large, static, frequently-reused prefix is the textbook prompt-caching case — cache_control cuts both latency and cost without losing context. Downgrading the model risks quality, truncation loses information, and a rate-limit bump addresses throughput, not the per-call waste. Judgment: match the fix to the actual cost driver."
}
```

---

## 8. Out of scope (tracked separately)

- Cloud Functions to read `exam_questions`, build sessions, sanitize per mode, and reveal answers.
- Firestore security rules for the `exam_questions` collection (deny client access).
- Web client changes to fetch questions via functions instead of the in-code banks.
- Migration/removal of the placeholder banks (`web/src/data/practiceQuestions.js`, `functions/practiceBank.js`).
- Any admin UI for editing questions.

---

## 9. Authoring plan (summary)

Author the 60 questions **domain by domain, with a review gate after each domain**:

1. **D1 (16)** → you review tone/difficulty/distractor quality → adjust the template if needed.
2. Then **D2 (12)**, **D3 (12)**, **D4 (11)**, **D5 (9)**, each followed by a review checkpoint.
3. Final pass: coverage check (every topic represented, archetype mix on target, `claudeSpecific` flags sane), then assemble into the agreed Firestore shape for you to load.

Detailed step-by-step authoring + delivery will be captured in an implementation plan after this spec is approved.
