/* global React, ReactDOM, IOSDevice, PracticeHub, ExamRunner, ResultsReview, HistoryView, LeaderboardView, SignInModal, PostModal */
// mobile-gallery.jsx — static iOS-frame showcase of the Practice Exam on mobile.
// Reuses the exact same presentational components as the web app, fed canned props.
// Wrapped in an IIFE so top-level consts (DOMAINS, P, …) don't collide with the
// global lexical bindings declared by data.js.
(function () {
const P = window.CCA_PRACTICE;
window.__galleryRan = "start";
const { DOMAINS } = window.CCA_DATA;
const noop = () => {};

function emptyPD() {
  const pd = {};
  DOMAINS.forEach((d) => (pd[d.id] = { correct: 0, total: 0 }));
  return pd;
}
function correctPos(inst) {
  return inst.optOrder.findIndex((o) => P.questionById(inst.qid).options[o].correct);
}
function demoAttempt(mode, pct, agoDays) {
  const at = P.createAttempt(mode);
  const target = Math.round((pct / 100) * at.instances.length);
  at.instances.forEach((inst, i) => {
    const cp = correctPos(inst);
    at.answers[i] = i < target ? cp : (cp + 1) % 4;
  });
  const score = P.scoreAttempt(at);
  const ago = (agoDays || 1) * 86400000;
  return { ...at, submitted: true, submittedAt: Date.now() - ago, createdAt: Date.now() - ago, score };
}

// canned data
const passAttempt = demoAttempt("timed", 82, 1);
const failAttempt = demoAttempt("timed", 58, 4);
const histAttempts = [passAttempt, demoAttempt("timed", 75, 3), demoAttempt("practice", 68, 6)];
const populatedStats = {
  attempts: 3,
  best: 82,
  bestPass: true,
  last: 82,
  perDomain: passAttempt.score.perDomain,
};
const emptyStats = { attempts: 0, best: 0, bestPass: false, last: null, perDomain: emptyPD() };

const seedSorted = P.SEED_LEADERBOARD.slice().sort((a, b) => b.score - a.score);
const youEntry = { handle: "mohammed", score: 81, anon: false, date: "2026-05-28" };
const boardWithYou = [...P.SEED_LEADERBOARD, { ...youEntry, isYou: true }]
  .sort((a, b) => b.score - a.score);

// runner states
const timedFresh = P.createAttempt("timed");
const practiceAnswered = (() => {
  const a = P.createAttempt("practice");
  a.answers = { 0: correctPos(a.instances[0]) };
  return a;
})();
const timedLow = (() => {
  const a = P.createAttempt("timed");
  a.answers = { 0: 1, 1: 2, 2: 0, 3: 3, 4: 1 };
  a.flags = { 2: true, 7: true };
  return a;
})();

function MTop({ title, tab }) {
  const tabs = ["Overview", "History", "Leaderboard"];
  return (
    <div className="pe-m-top">
      <div className="pe-m-title">{title}</div>
      {tab ? (
        <div className="pe-tabs pe-m-tabs">
          {tabs.map((t) => (
            <span key={t} className={`pe-tab ${t === tab ? "is-active" : ""}`}>{t}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Phone({ caption, children, scope = true }) {
  return (
    <div className="gframe">
      <IOSDevice dark width={384} height={812}>
        <div className={`pe-mobile pe-mobile-screen ${scope ? "frame-scope" : ""}`}>
          {children}
        </div>
      </IOSDevice>
      <div className="gcap">{caption}</div>
    </div>
  );
}

function Gallery() {
  return (
    <div className="gallery">
      <header className="ghead">
        <div className="ghead-eyebrow">CCA-F Study Hub · Practice Exam</div>
        <h1>Mobile layouts</h1>
        <p>The same React components as the web app, rendered at phone width with the <code>.pe-mobile</code> layout mode. Every sub-view and key state, on device.</p>
      </header>

      <section className="gsection">
        <h2 className="gsec">1 · Hub / landing</h2>
        <div className="grow">
          <Phone caption="Signed out — Timed Exam is sign-in gated, Practice is open. No attempts yet (empty state).">
            <MTop title="Practice exam" tab="Overview" />
            <PracticeHub stats={emptyStats} signedIn={false} user={null} onStart={noop} onSignIn={noop} onGoto={noop} />
          </Phone>
          <Phone caption="Signed in — stats snapshot: best score, attempts, last result, per-domain strengths.">
            <MTop title="Practice exam" tab="Overview" />
            <PracticeHub stats={populatedStats} signedIn={true} user={{ handle: "mohammed" }} onStart={noop} onSignIn={noop} onGoto={noop} />
          </Phone>
        </div>
      </section>

      <section className="gsection">
        <h2 className="gsec">2 · Exam runner</h2>
        <div className="grow">
          <Phone caption="Timed mode — countdown prominent, unanswered question, single-column options.">
            <ExamRunner attempt={timedFresh} current={0} secondsLeft={5402} onSelect={noop} onFlag={noop} onNav={noop} onPrev={noop} onNext={noop} onSubmit={noop} onExit={noop} />
          </Phone>
          <Phone caption="Practice mode — instant feedback: correct option highlighted, explanation revealed, Next to continue.">
            <ExamRunner attempt={practiceAnswered} current={0} secondsLeft={null} onSelect={noop} onFlag={noop} onNav={noop} onPrev={noop} onNext={noop} onSubmit={noop} onExit={noop} />
          </Phone>
          <Phone caption="Time running low (under 1 min) warning + question map sheet open with answered / flagged / current states.">
            <ExamRunner attempt={timedLow} current={3} secondsLeft={47} defaultNavOpen onSelect={noop} onFlag={noop} onNav={noop} onPrev={noop} onNext={noop} onSubmit={noop} onExit={noop} />
          </Phone>
        </div>
      </section>

      <section className="gsection">
        <h2 className="gsec">3 · Results and review</h2>
        <div className="grow">
          <Phone caption="Pass — % vs 72% pass line, per-domain breakdown, question-by-question review below.">
            <ResultsReview attempt={passAttempt} posted={null} onPost={noop} onRetake={noop} onHome={noop} onLeaderboard={noop} />
          </Phone>
          <Phone caption="Fail — clear fail treatment; review filtered to incorrect for targeted study.">
            <ResultsReview attempt={failAttempt} posted={null} onPost={noop} onRetake={noop} onHome={noop} onLeaderboard={noop} />
          </Phone>
        </div>
      </section>

      <section className="gsection">
        <h2 className="gsec">4 · History</h2>
        <div className="grow">
          <Phone caption="Past attempts with mode, score, pass/fail, date — plus a score trend over time.">
            <MTop title="Practice exam" tab="History" />
            <HistoryView attempts={histAttempts} onOpen={noop} onStart={noop} />
          </Phone>
          <Phone caption="Empty state — no attempts yet.">
            <MTop title="Practice exam" tab="History" />
            <HistoryView attempts={[]} onOpen={noop} onStart={noop} />
          </Phone>
        </div>
      </section>

      <section className="gsection">
        <h2 className="gsec">5 · Leaderboard</h2>
        <div className="grow">
          <Phone caption="Not posted — opt-in CTA shows your would-be rank even while private.">
            <MTop title="Practice exam" tab="Leaderboard" />
            <LeaderboardView board={seedSorted} you={null} yourBest={81} onOpenPost={noop} onUnpost={noop} />
          </Phone>
          <Phone caption="Posted — your row highlighted in the global board; edit or remove anytime.">
            <MTop title="Practice exam" tab="Leaderboard" />
            <LeaderboardView board={boardWithYou} you={youEntry} yourBest={81} onOpenPost={noop} onUnpost={noop} />
          </Phone>
        </div>
      </section>

      <section className="gsection">
        <h2 className="gsec">6 · Modals</h2>
        <div className="grow">
          <Phone caption="Sign-in — required for timed exams and the leaderboard.">
            <SignInModal onClose={noop} onSignIn={noop} />
          </Phone>
          <Phone caption="Leaderboard opt-in — pick a handle or post as Anonymous.">
            <PostModal score={81} defaultHandle="mohammed" defaultAnon={false} onClose={noop} onPost={noop} />
          </Phone>
        </div>
      </section>
    </div>
  );
}

class EB extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return React.createElement("pre", { style: { color: "#f88", padding: 40, fontFamily: "monospace", whiteSpace: "pre-wrap", fontSize: 12 } }, String(this.state.err.stack || this.state.err));
    }
    return this.props.children;
  }
}

try {
  window.__galleryRan = "before-render";
  ReactDOM.createRoot(document.getElementById("root")).render(
    React.createElement(EB, null, React.createElement(Gallery))
  );
  window.__galleryRan = "after-render";
} catch (e) {
  document.getElementById("root").innerHTML = "<pre style='color:#f88;padding:40px;font-family:monospace;white-space:pre-wrap'>" + (e && e.stack ? e.stack : e) + "</pre>";
}
})();
