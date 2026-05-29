// practice-data.js — CCA-F Practice Exam question bank + attempt logic.
// Placeholder question/answer content (real ~100 questions supplied later).
// Tied to real domain topics so structure feels authentic.
// Depends on window.CCA_DATA (data.js) loading first.

(function () {
  const { DOMAINS } = window.CCA_DATA;

  const PASS_PCT = 72;
  const DURATION_MIN = 120;
  // Blueprint weighting — must total 60.
  const BLUEPRINT = { d1: 16, d2: 12, d3: 12, d4: 11, d5: 9 };

  // ---- phrasing pools (2-3 equivalent variants shown at random) ----
  const CORRECT_POOL = [
    [
      "Apply the documented best-practice pattern and validate the result before continuing.",
      "Use the recommended pattern, then verify the output before moving on.",
      "Follow the canonical approach and confirm the result is valid first.",
    ],
    [
      "Use the recommended approach with explicit error handling and a fallback path.",
      "Adopt the standard approach, handling errors explicitly with a fallback.",
      "Go with the documented method and add an explicit fallback for failures.",
    ],
    [
      "Choose the right model tier for the task and constrain the output to a schema.",
      "Match the model tier to task complexity and enforce a strict output schema.",
      "Right-size the model for the step and validate output against a schema.",
    ],
  ];
  const DISTRACTOR_POOL = [
    [
      "Skip validation and trust the model's first response.",
      "Assume the first response is correct and skip any checks.",
    ],
    [
      "Use the most expensive model tier for every step regardless of complexity.",
      "Default to the top-tier model everywhere, even for trivial steps.",
      "Always pick the largest model no matter how simple the task is.",
    ],
    [
      "Cram all available context into one unstructured prompt.",
      "Put every document into a single prompt with no structure.",
    ],
    [
      "Retry indefinitely with no backoff or escape condition.",
      "Loop forever on failure without any backoff or exit.",
      "Keep retrying immediately with no limit and no backoff.",
    ],
    [
      "Ignore returned errors and proceed as if the call succeeded.",
      "Swallow the error and continue as though nothing failed.",
    ],
    [
      "Hard-code the behavior and ignore edge cases entirely.",
      "Bake in a fixed path and leave failure modes unhandled.",
    ],
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

  function stemVariants(topic) {
    const t = topic.name;
    return [
      `Which approach best handles ${t.toLowerCase()} in a production Claude system?`,
      `A team is implementing ${t.toLowerCase()}. What is the recommended pattern?`,
      `Scenario: ${topic.desc}. Which choice is correct?`,
    ];
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
  // phrasing + option order per question so re-renders stay stable.
  function createAttempt(mode) {
    const order = shuffle(BANK);
    const instances = order.map((q) => {
      const optOrder = shuffle(q.options.map((_, i) => i));
      return {
        qid: q.id,
        domain: q.domain,
        stemIdx: Math.floor(Math.random() * q.stem.length),
        optOrder, // display position -> original option index
        phraseIdx: q.options.map((o) => Math.floor(Math.random() * o.text.length)),
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

  // Resolve a display instance to renderable text.
  function renderInstance(inst) {
    const q = questionById(inst.qid);
    const opts = inst.optOrder.map((origIdx) => {
      const o = q.options[origIdx];
      return {
        origIdx,
        correct: o.correct,
        text: o.text[inst.phraseIdx[origIdx] % o.text.length],
      };
    });
    return {
      q,
      stem: q.stem[inst.stemIdx],
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
