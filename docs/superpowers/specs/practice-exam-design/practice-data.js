// practice-data.js — CCA-F Practice Exam question bank + attempt logic.
// Placeholder question/answer content (real ~100 questions supplied later).
// Tied to real domain topics so structure feels authentic.
// Depends on window.CCA_DATA (data.js) loading first.
//
// MODE-SPLIT CONTENT (answer-key isolation): every question holds two disjoint
// content sets — `practice` (1-2 stem/phrasing wordings) and `timed` (2-3,
// distinct wordings). In the real apps these live in SEPARATE files so the timed
// answer key never ships to the client: practice content in
// web/src/data/practiceQuestions.js, timed content in functions/practiceBank.js
// (server only). This prototype keeps both sets together for demonstration and
// selects the set for a session by its mode (stored on each instance).

(function () {
  const { DOMAINS } = window.CCA_DATA;

  const PASS_PCT = 72;
  const DURATION_MIN = 120;
  // Blueprint weighting — must total 60.
  const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 };

  // ---- phrasing pools, split by mode ----
  // practice: 1-2 wordings (ship to client). timed: 2-3 wordings (server only),
  // deliberately DISTINCT strings from practice.
  const CORRECT_POOL = [
    {
      practice: [
        "Apply the documented best-practice pattern and validate before continuing.",
        "Use the recommended pattern, then verify the output.",
      ],
      timed: [
        "Adopt the canonical production pattern and confirm the result is valid before proceeding.",
        "Follow the established best-practice approach, then validate the outcome before the next step.",
        "Use the prescribed pattern and verify correctness before continuing the workflow.",
      ],
    },
    {
      practice: [
        "Use the recommended approach with explicit error handling and a fallback.",
        "Handle errors explicitly and add a fallback path.",
      ],
      timed: [
        "Implement the standard approach with explicit error handling plus a defined fallback path.",
        "Apply the documented method, handling failures explicitly and providing a fallback.",
        "Use the recommended technique with deliberate error handling and a recovery fallback.",
      ],
    },
    {
      practice: [
        "Right-size the model for the step and constrain output to a schema.",
        "Match the model tier to the task and enforce an output schema.",
      ],
      timed: [
        "Select the model tier appropriate to task complexity and validate output against a strict schema.",
        "Match model capability to the step and constrain the response to a defined schema.",
        "Choose a right-sized model for the task and enforce schema-validated output.",
      ],
    },
  ];
  const DISTRACTOR_POOL = [
    {
      practice: ["Skip validation and trust the first response."],
      timed: [
        "Bypass validation entirely and accept the model's initial response as final.",
        "Assume the first generation is correct and perform no verification.",
      ],
    },
    {
      practice: [
        "Use the most expensive model tier for every step.",
        "Default to the top-tier model everywhere.",
      ],
      timed: [
        "Route every step to the largest, most expensive model regardless of complexity.",
        "Always select the top-tier model even for trivial sub-tasks.",
        "Use maximum model capability for all steps without regard to cost or need.",
      ],
    },
    {
      practice: ["Cram all context into one unstructured prompt."],
      timed: [
        "Concatenate every available document into a single unstructured prompt.",
        "Load all context into one prompt with no structure or sectioning.",
      ],
    },
    {
      practice: [
        "Retry indefinitely with no backoff.",
        "Loop forever on failure with no exit.",
      ],
      timed: [
        "Retry the operation indefinitely with neither backoff nor an escape condition.",
        "Loop on failure without any backoff, limit, or exit criterion.",
        "Re-attempt immediately and endlessly on error with no termination.",
      ],
    },
    {
      practice: ["Ignore returned errors and proceed."],
      timed: [
        "Disregard returned errors and continue as though the call succeeded.",
        "Swallow error responses and proceed as if nothing failed.",
      ],
    },
    {
      practice: ["Hard-code the behavior and ignore edge cases."],
      timed: [
        "Hard-code a single fixed path and leave all edge cases unhandled.",
        "Bake in fixed behavior and ignore failure modes entirely.",
      ],
    },
  ];

  function pick(arr, n) {
    // return n distinct random elements
    const copy = arr.slice();
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return out;
  }

  // stems split by mode: practice 1-2 wordings, timed 2-3 (distinct).
  function stemVariants(topic) {
    const t = topic.name.toLowerCase();
    return {
      practice: [
        `Which approach best handles ${t} in a production Claude system?`,
        `A team is implementing ${t}. What is the recommended pattern?`,
      ],
      timed: [
        `In a production Claude deployment, which approach correctly handles ${t}?`,
        `A team is rolling out ${t} to production. Which pattern is recommended?`,
        `Scenario: ${topic.desc}. Which option reflects the correct practice?`,
      ],
    };
  }

  // ---- build a stable bank ----
  let qCounter = 0;
  const BANK = [];
  DOMAINS.forEach((d) => {
    const count = BLUEPRINT[d.id];
    for (let i = 0; i < count; i++) {
      const topic = d.topics[i % d.topics.length];
      const correct = CORRECT_POOL[(qCounter + i) % CORRECT_POOL.length];
      const distractors = pick(DISTRACTOR_POOL, 3);
      const options = [
        { correct: true, text: correct },
        ...distractors.map((dd) => ({ correct: false, text: dd })),
      ];
      BANK.push({
        id: `q${++qCounter}`,
        domain: d.id,
        topicName: topic.name,
        stem: stemVariants(topic),
        options,
        explanation:
          `Placeholder explanation — the correct choice applies the “${topic.name}” best practice from Domain ${d.num}; ` +
          `the distractors are common anti-patterns. Full rationale will be added with the real question content.`,
      });
    }
  });

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Create an attempt: pick the full domain-weighted set, freeze a random
  // phrasing + option order per question so re-renders stay stable. The session
  // mode selects which content set (practice | timed) each instance draws from.
  function createAttempt(mode) {
    const order = shuffle(BANK);
    const instances = order.map((q) => {
      const optOrder = shuffle(q.options.map((_, i) => i));
      return {
        qid: q.id,
        domain: q.domain,
        mode, // which content set this instance renders from
        stemIdx: Math.floor(Math.random() * q.stem[mode].length),
        optOrder, // display position -> original option index
        phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.text[mode].length)),
      };
    });
    return {
      id: `a${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      mode, // "timed" | "practice"
      createdAt: Date.now(),
      durationMs: mode === "timed" ? DURATION_MIN * 60 * 1000 : null,
      instances,
      answers: {}, // instanceIndex -> displayPosition selected
      flags: {}, // instanceIndex -> bool
      submitted: false,
    };
  }

  function questionById(id) {
    return BANK.find((q) => q.id === id);
  }

  // Resolve a display instance to renderable text for its mode's content set.
  function renderInstance(inst) {
    const q = questionById(inst.qid);
    const mode = inst.mode || "practice";
    const opts = inst.optOrder.map((origIdx) => {
      const o = q.options[origIdx];
      const set = o.text[mode];
      return {
        origIdx,
        correct: o.correct,
        text: set[inst.phraseIdx[origIdx] % set.length],
      };
    });
    return {
      q,
      stem: q.stem[mode][inst.stemIdx],
      opts,
      explanation: q.explanation,
    };
  }

  function scoreAttempt(attempt) {
    let correct = 0;
    const perDomain = {};
    DOMAINS.forEach((d) => (perDomain[d.id] = { correct: 0, total: 0 }));
    attempt.instances.forEach((inst, idx) => {
      perDomain[inst.domain].total++;
      const sel = attempt.answers[idx];
      if (sel === undefined) return;
      const origIdx = inst.optOrder[sel];
      const q = questionById(inst.qid);
      if (q.options[origIdx].correct) {
        correct++;
        perDomain[inst.domain].correct++;
      }
    });
    const total = attempt.instances.length;
    const pct = Math.round((correct / total) * 100);
    return { correct, total, pct, pass: pct >= PASS_PCT, perDomain };
  }

  // ---- seed leaderboard (best timed score per user) ----
  const SEED_LEADERBOARD = [
    { handle: "agentsmith", score: 97, date: "2026-05-21", anon: false },
    { handle: "mcp_maxine", score: 95, date: "2026-05-19", anon: false },
    { handle: "Anonymous", score: 93, date: "2026-05-24", anon: true },
    { handle: "promptwright", score: 92, date: "2026-05-12", anon: false },
    { handle: "ctx_window", score: 90, date: "2026-05-18", anon: false },
    { handle: "haiku_haiku", score: 88, date: "2026-05-20", anon: false },
    { handle: "Anonymous", score: 87, date: "2026-05-22", anon: true },
    { handle: "sonnet_dev", score: 85, date: "2026-05-15", anon: false },
    { handle: "loop_breaker", score: 83, date: "2026-05-23", anon: false },
    { handle: "tooluse_tia", score: 81, date: "2026-05-11", anon: false },
    { handle: "ragnar", score: 78, date: "2026-05-17", anon: false },
    { handle: "cache_control", score: 74, date: "2026-05-16", anon: false },
  ];

  window.CCA_PRACTICE = {
    PASS_PCT,
    DURATION_MIN,
    BLUEPRINT,
    BANK,
    SEED_LEADERBOARD,
    createAttempt,
    renderInstance,
    scoreAttempt,
    questionById,
  };
})();
