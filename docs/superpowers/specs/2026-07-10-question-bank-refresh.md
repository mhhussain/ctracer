# Question Bank Refresh — 2026-07-10

Merged the externally sourced CCA-F prep guide (`docs/knowledge-base/raw/20260710-questions.md`, 33 Q&As from a real exam taker) into the canonical bank (`data/examQuestionBank.mjs`).

## Ground rules (agreed before execution)

- Bank stays the base; count fixed at 60; blueprint (d1:16 d2:12 d3:12 d4:11 d5:9) unchanged. No net-new questions.
- Full slot rewrite allowed: topic (within domain), archetype, stem, options, explanation may all change; `id` and `domain` stay.
- Decision rule per raw Q: (1) overlap + raw stronger → rewrite slot; (2) raw concept absent → replace weakest/redundant bank slot in matching domain; (3) bank already stronger → keep bank; (4) untouched bank Qs left alone.
- Raw guide's meta-lessons used as quality lens: prefer structural fixes over prompt fixes; machine IDs over ambiguous strings; distrust self-reported metadata; don't over-spawn subagents.
- `TOPICS.d5` gained `'Batch processing'`. Raw Qs converted to bank shape: 4 options, variance budget (correct: 2 practice + 1 timed; distractor: 1 practice + 2 timed), fresh metadata.

## Mapping — all 33 raw questions

| Raw Q | Concept | Decision |
|---|---|---|
| Q1 | stated vs calculated total, semantic error flagging | **Rewrote d3-005** (was: generic malformed-input handling) |
| Q2 | refine prompt on sample before batch | **Rewrote d1-015** (was: cost-cutting critique, overlapped d1-014 tiering) |
| Q3 | 6-hour batch SLA math | **Rewrote d5-002** (was: model selection — tiering judgment already covered by d1-012/d1-014) |
| Q4 | conflicting source values, preserve provenance | **Rewrote d3-007** (was: basic structured-output recall) |
| Q5 | search tool returns document_id | Skipped — same lesson as Q13, which is richer |
| Q6 | primary advantage of structured output | Skipped — covered by d3-007 family |
| Q7 | dynamic tool scoping for 50+ connectors | **Rewrote d4-002** (was: curate 30 vague tools — weaker version of same failure) |
| Q8 | enum parameters for ambiguous names | Skipped — adjacent to d4-001 schema-descriptions and d4-006 ID pattern |
| Q9 | pagination metadata in tool output | Skipped — scoped-output principle covered in d4-004 critique |
| Q10 | MCP annotations are untrusted metadata | **Rewrote d4-005** (was: Resource-primitive recall; Q19 rewrite keeps Resources covered in scenario form) |
| Q11 | internalize predictable tool dependencies | Skipped — lower priority than the 7 raw Qs placed in d4's 11 slots |
| Q12 | normalize heterogeneous tool outputs | Skipped — same reason as Q11; partially covered by d4-004 |
| Q13 | lookup/action split via game_id | **Rewrote d4-006** (was: MCP client re-handshake — niche) |
| Q14 | enforce $500 rule inside tool logic | **Rewrote d4-009** (was: web-search-tool critique — easy) |
| Q15 | parameter descriptions | Skipped — d4-001 already tests exactly this |
| Q16 | transient-retry vs syntax-error split | **Rewrote d4-010** (was: error-flagging basics — Q16 subsumes it) |
| Q17 | archive vs delete description boundaries | Skipped — covered by d4-001/d4-002 |
| Q18 | resume session, state the 3-file delta | **Rewrote d1-007** (was: retry/backoff — intra-bank duplicate of d5-006) |
| Q19 | expose catalogs as MCP Resources | **Rewrote d4-008** (was: MCP Inspector trivia) |
| Q20 | prompt chaining for fixed 3-aspect workflows | **Rewrote d1-004** (was: generic loop-shape recall) |
| Q21 | coordinator answers follow-ups itself | **Rewrote d1-002** (was: 12-subagent over-decomposition — same lesson, Q21 sharper) |
| Q22 | inject structured findings into subagent prompt | **Rewrote d1-006** (was: tool-chain error propagation — overlapped d4-010) |
| Q23 | goal-oriented vs procedural subagent prompts | **Rewrote d1-013** (was: confidence routing — overlapped d1-012) |
| Q24 | parallel Task calls in one response | **Rewrote d1-009** (was: simple parallelize-200-docs) |
| Q25 | conflict_detected + methodology metadata | Skipped — provenance/conflict lesson lands via d3-007 (Q4) and d5-005 (Q26) |
| Q26 | narrative + citation index hand-off | **Rewrote d5-005** (was: generic context discipline) |
| Q27 | citation_id anchors through summarization | Skipped — substantially covered by d5-005 (Q26) |
| Q28 | checkpoint + fresh session after crash | **Rewrote d1-005** (was: transcript-replay bloat — lesson kept via d2-012/d5-005) |
| Q29 | publication_date temporal metadata (no options in source) | Skipped — folded conceptually into the Q4/Q26 provenance family |
| Q30 | stratified accuracy before automating | **Rewrote d5-009** (was: eval-set-vs-vibes — related but weaker discriminator) |
| Q31 | custom_id resubmit of batch failures | **Rewrote d5-007** (was: streaming for perceived latency — trivial) |
| Q32 | tool defs consume context near the limit | **Rewrote d5-001** (was: generic context-budget) |
| Q33 | tool_choice forced then auto | **Rewrote d4-011** (was: live-tool vs RAG tradeoff) |

## Outcome

22 slots rewritten (d1: 8, d3: 2, d4: 7, d5: 5), 38 untouched. d2 (Claude Code) untouched — the raw guide contains no Claude Code content. 11 raw Qs skipped with reasons above. Validation: `node data/validateBank.mjs --complete` → 60/60 OK. `exam-question-bank.firestore.json` regenerated; Firestore seeding remains a user-run step.
