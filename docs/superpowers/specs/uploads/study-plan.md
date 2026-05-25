# CCA-F Study Plan & Preparation Guide

**Estimated timeline:**
- Experienced AI developers (Mohammed's profile): **3–5 weeks**
- Engineers newer to Claude: 2–4 months

---

## Recommended Study Sequence

### Phase 1 — Foundation (Week 1)
Goal: Refresh core concepts, fill any gaps

| Task | Time | Notes |
|---|---|---|
| Claude Code 101 | ~2 hrs | Quick baseline if not already deep in Claude Code |
| Claude 101 | ~3 hrs | Good for understanding non-dev persona; useful for recommending to XBy2 broadly |
| Building with the Claude API — Modules 1-3 | ~2 hrs | API auth, multi-turn, system prompts, structured output |
| Review Anthropic docs: Messages API reference | ~1 hr | Know it cold — no docs during exam |

### Phase 2 — Core Exam Domains (Weeks 2–3)
Goal: Cover all five domains with hands-on projects

**Week 2: Agentic + MCP (heaviest exam domains)**

| Task | Time | Domain |
|---|---|---|
| Building with the Claude API — Agents & Workflows module | ~1.5 hrs | D1 |
| Introduction to Subagents (course) | ~1 hr | D1 |
| Introduction to Model Context Protocol (full course) | ~2 hrs | D4 |
| Model Context Protocol: Advanced Topics | ~2 hrs | D4 |
| **Project:** Build MCP server with tools + resources + prompts | ~3 hrs | D4 |
| **Project:** Multi-step agentic workflow with fallback logic | ~3 hrs | D1 |

**Week 3: Claude Code + Prompt Engineering**

| Task | Time | Domain |
|---|---|---|
| Claude Code in Action (full course) | ~6 hrs | D2 |
| Introduction to Agent Skills (full course) | ~1 hr | D2 |
| Building with the Claude API — Prompt Engineering module | ~1 hr | D3 |
| Building with the Claude API — Prompt Evaluation module | ~1 hr | D3 |
| **Project:** Set up full CLAUDE.md hierarchy + custom Skill | ~2 hrs | D2 |
| **Project:** Prompt eval pipeline with auto-grading | ~2 hrs | D3 |

### Phase 3 — Context Management + Integration (Week 4)
Goal: Close out Domain 5; do full RAG build

| Task | Time | Domain |
|---|---|---|
| Building with the Claude API — RAG & Agentic Search module | ~1.5 hrs | D5 |
| Building with the Claude API — Features of Claude module | ~1.5 hrs | D5 |
| **Project:** Full RAG pipeline (chunking → embeddings → vector search → Claude) | ~4 hrs | D5 |
| **Project:** Prompt caching on high-volume prompt | ~1 hr | D3/D5 |
| Review: extended thinking, PDF/image support, Citations, Files API | ~1 hr | D5 |

### Phase 4 — Exam Prep (Week 5 or Final Week)
Goal: Solidify, identify gaps, practice scenarios

| Task | Time |
|---|---|
| claudecertifications.com — 33+ practice questions | ~2 hrs |
| Review all 5 domain anti-patterns (what NOT to do) | ~1 hr |
| Re-read key Anthropic docs: tool use reference, MCP spec, Claude Code docs | ~2 hrs |
| Review architecture tradeoffs: latency vs. cost vs. reliability decisions | ~1 hr |
| Mock exam simulation (timed, no reference material) | ~2 hrs |

---

## Essential Projects to Build

Building projects is **more valuable than completing courses alone**. These five projects cover all five domains:

### 1. RAG Knowledge Assistant (Domain 5 + 3)
**What:** Document ingestion → vector database → Claude with structured prompts  
**Covers:** Text chunking, embeddings, vector search, BM25, context window management, prompt caching  
**Complexity:** Medium

### 2. Tool-Enabled Support Chatbot (Domain 4 + 1)
**What:** Claude calling external APIs for real data retrieval in a multi-turn conversation  
**Covers:** Tool schemas, message blocks, sending tool results, multi-turn tool use, error handling  
**Complexity:** Medium

### 3. Multi-Step Autonomous Agent (Domain 1 — most important)
**What:** Orchestrated tool sequences completing complex tasks autonomously with fallback logic  
**Covers:** Agentic loops, parallelization, routing, chaining, failure modes, retry logic  
**Complexity:** High — this is the hardest domain, spend the most time here

### 4. MCP Server (Domain 4)
**What:** Python MCP server with tools, resources, and prompts; tested via Server Inspector  
**Covers:** All three MCP primitives, Python SDK decorators, client/server communication  
**Complexity:** Medium

### 5. Prompt Eval Pipeline (Domain 3)
**What:** Automated eval system with test datasets, model-based grading, and retry on failure  
**Covers:** Eval workflow, JSON schema enforcement, validation retry loops, code-based grading  
**Complexity:** Medium

---

## Key Concepts to Know Cold (No Docs During Exam)

### API
- `messages` API structure: roles, content blocks, system prompt placement
- Streaming: how to handle chunked responses
- Tool use message flow: assistant tool_use block → user tool_result block
- `cache_control` parameter syntax for prompt caching
- Rate limit error codes: 429 (rate limit), 529 (overload)

### Models
- Haiku: fast, cheap, simple tasks
- Sonnet: balanced, most production use
- Opus: complex reasoning, highest cost
- Context window sizes (approximate): Haiku 200K, Sonnet 200K, Opus 200K

### MCP
- Three primitives and when to use each: Tools (model decides), Resources (app serves), Prompts (user selects)
- Python decorator syntax: `@mcp.tool()`, `@mcp.resource()`, `@mcp.prompt()`
- MCP vs. direct tool use: when to use which

### Claude Code
- CLAUDE.md hierarchy: global (`~/.claude/CLAUDE.md`) → project (`.claude/CLAUDE.md`) → local
- Settings files: `settings.json` (project) vs `settings.local.json` (local overrides)
- Hook types: PreToolUse, PostToolUse, PreCompact, Stop
- Skill frontmatter: description triggers automatic application

### Agentic Patterns
- Parallelization: run independent tasks concurrently
- Chaining: output of one step is input to next
- Routing: classify input, route to appropriate handler
- Orchestrator/subagent: orchestrator plans, subagents execute

---

## Anti-Patterns (Expect Trap Questions)

- Putting everything in one giant CLAUDE.md instead of using hierarchy
- Using Opus for simple classification tasks (cost waste)
- Tool schemas with ambiguous parameter names (causes model confusion)
- No fallback/timeout in agentic loops (infinite loops)
- Ignoring tool result errors in multi-turn tool use
- No validation on structured output (relying on model to always produce valid JSON)
- Cache breakpoints in wrong position (must be at stable/static boundary)
- Treating MCP resources as tools (resources are read-only, app-controlled)

---

## Study Resources

| Resource | Type | Cost |
|---|---|---|
| anthropic.skilljar.com | Official courses | Free |
| claudecertifications.com | Practice questions + study guide | Free |
| docs.anthropic.com | API reference | Free |
| claudeimplementation.com/blog | Partner network + exam guidance | Free |
| certstud.com/blog/anthropic-cca-f | Domain breakdown | Free |
| lowcode.agency/blog/how-to-become-claude-certified-architect | Step-by-step guide | Free |
| Udemy CCA-F practice exams | Practice questions | Paid (~$15) |
