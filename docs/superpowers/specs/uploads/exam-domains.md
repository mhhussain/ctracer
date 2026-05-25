# CCA-F Exam Domains — Detailed Breakdown

**Total:** 60 questions | 120 minutes | Passing: 720/1,000

---

## Domain 1 — Agentic Architecture & Orchestration (27%)
**Heaviest domain — 16 questions**

### What It Tests
Designing autonomous multi-step systems that reliably complete complex tasks without human intervention. Requires genuine understanding of agentic system design, not just prompting basics.

### Key Topics
- **Multi-agent patterns**: orchestrator/subagent models, parallel agent execution, agent handoff protocols
- **Agentic loops**: designing reliable loops with fallback conditions and escape hatches
- **Session management**: maintaining state across multi-turn agentic workflows
- **Tool orchestration**: sequencing tool calls, handling tool failures, retry logic
- **Parallelization workflows**: running agents concurrently for efficiency
- **Chaining workflows**: sequential task decomposition and result passing
- **Routing workflows**: directing tasks to the right agent/model based on context
- **Fallback loop design**: graceful degradation when steps fail
- **Cost optimization**: using the right model tier (Haiku vs Sonnet vs Opus) at each stage

### What to Build to Learn This
- Multi-step agent that completes complex tasks autonomously
- Orchestrator that routes subtasks to specialized subagents
- Workflow with retry/fallback logic on tool failure

---

## Domain 2 — Claude Code Configuration & Workflows (20%)
**12 questions**

### What It Tests
Production-level use of Claude Code as a development tool — not just running it, but configuring it at the architecture level for teams and CI/CD pipelines.

### Key Topics
- **CLAUDE.md hierarchies**: global, project, and local CLAUDE.md files; precedence rules; what belongs at each level
- **Custom slash commands**: creating, structuring, and sharing commands for repetitive tasks
- **Agent Skills**: building reusable Skills (.md files with frontmatter), triggering conditions, sharing across teams
- **Hooks**: pre/post tool call hooks, use cases, common pitfalls, implementation patterns
- **MCP server integration within Claude Code**: connecting external services via MCP
- **GitHub integration**: automating PR reviews, code generation workflows, CI/CD hooks
- **Context management**: `/clear`, `/compact`, context window discipline in long sessions
- **Claude Code SDK**: programmatic use of Claude Code outside the CLI
- **Subagents**: creating and using subagents to delegate specialized tasks, manage context
- **Tool access restrictions**: controlling what tools a Skill or subagent can call
- **Configuration files**: settings.json, settings.local.json — permissions, env vars, hooks

### What to Build to Learn This
- Set up CLAUDE.md hierarchy for a real project
- Build and deploy a custom Skill for a recurring workflow
- Implement a pre-commit hook using Claude Code hooks

---

## Domain 3 — Prompt Engineering & Structured Output (20%)
**12 questions**

### What It Tests
Designing prompts that produce reliable, predictable output at production scale — not clever prompts, but engineering-grade prompt systems with validation and fallback.

### Key Topics
- **System prompts**: role framing, instruction hierarchy, scope limiting
- **XML tags**: structuring complex prompts with `<instructions>`, `<examples>`, `<context>` tags
- **Few-shot examples**: when and how to use them; format and placement
- **Chain-of-thought**: when to use extended thinking vs standard prompting
- **JSON schema enforcement**: using schemas to constrain model output format
- **Structured output**: forcing reliable JSON/XML responses, handling partial failures
- **Validation retry loops**: detecting bad output and re-prompting automatically
- **Hallucination prevention**: schema constraints, grounding techniques, citation enforcement
- **Failure modes**: knowing when prompts will break and designing for it
- **Prompt evaluation**: automated eval workflows, test datasets, model-based and code-based grading
- **Temperature and sampling**: when to adjust; impact on reliability vs. creativity
- **Prompt caching**: using the `cache_control` parameter to reduce latency and cost

### What to Build to Learn This
- Prompt eval pipeline with automated grading
- JSON-constrained output system with retry loop on schema failure
- Prompt caching implementation on a high-volume prompt

---

## Domain 4 — Tool Design & MCP Integration (18%)
**~11 questions**

### What It Tests
Building and connecting tools that Claude can call — including designing good tool schemas and implementing production MCP servers.

### Key Topics
- **Tool use fundamentals**: tool schemas, function definitions, message blocks, sending tool results
- **Multi-tool systems**: using multiple tools in a single conversation; fine-grained tool calling
- **MCP architecture**: how MCP shifts tool definition from app servers to specialized MCP servers
- **MCP server building (Python SDK)**: using decorators instead of manual JSON schemas
- **MCP primitives**: 
  - Tools (model-controlled): actions Claude can take
  - Resources (app-controlled): read-only data Claude can access
  - Prompts (user-controlled): pre-crafted instruction templates
- **MCP client implementation**: connecting to MCP servers, handling responses
- **Static vs. templated resources**: when to use each
- **MCP Server Inspector**: browser-based testing tool for MCP servers
- **Web search tool**: built-in and custom search tool integration
- **Error handling in tool use**: graceful failure, informing the model of errors
- **Tool selection**: when to use tools vs. prompt context vs. RAG

### What to Build to Learn This
- MCP server with tools, resources, and prompts (Python)
- Claude integration that calls external APIs via tool use
- Test MCP server using the Server Inspector

---

## Domain 5 — Context Management & Reliability (15%)
**9 questions**

### What It Tests
Managing the context window effectively in production systems — keeping Claude focused, accurate, and consistent across long or complex interactions.

### Key Topics
- **Context window limits**: Haiku/Sonnet/Opus token limits; what happens at the boundary
- **Model selection criteria**: cost, speed, and capability tradeoffs across model families
- **Prompt caching**: reducing cost and latency on repeated context; `cache_control` breakpoints
- **RAG fundamentals**: text chunking strategies, embeddings, vector search, BM25 lexical search, multi-index pipelines
- **Context window discipline**: what to include vs. exclude; summary techniques for long sessions
- **Streaming responses**: when and how to use streaming; handling partial responses
- **Rate limits and error handling**: retry logic, backoff strategies, 429/529 handling
- **Extended thinking**: when to enable; cost implications; use cases
- **Image and PDF support**: multimodal inputs; limitations
- **Citations**: grounding responses in source documents
- **Files API and Code Execution**: uploading files; using the code execution tool
- **Consistency across sessions**: techniques for maintaining coherent long-running systems
- **Output evaluation frameworks**: how to measure and improve reliability at scale

### What to Build to Learn This
- RAG pipeline: document ingestion → vector DB → Claude with grounded output
- System with prompt caching on expensive, repeated context
- Eval framework measuring output reliability over 100+ test cases

---

## Exam Tips (from community reports)

- Questions are scenario-based — "given this architecture, what breaks?" not "what is X?"
- Agentic domain is hardest — expect tricky questions on fallback design and agent failure modes
- MCP questions focus on when to use tools vs. resources vs. prompts
- Prompt engineering questions test anti-patterns (what NOT to do) as much as best practices
- No access to docs during exam — know the API reference cold
- One reported score: 985/1,000 (so high scores are achievable with real experience)
