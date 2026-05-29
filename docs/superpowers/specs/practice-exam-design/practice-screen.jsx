/* global React, PracticeHub, ExamRunner, ResultsReview, HistoryView, LeaderboardView, bestTimed */
// practice-screen.jsx — ScreenPractice controller: subview routing, timer,
// sign-in + leaderboard-post modals. Lifts persistent state via usePracticeState (passed in).
const { useState: usesS, useEffect: useeS, useMemo: usemS, useRef: userS } = React;

function emptyPerDomain() {
  const pd = {};
  window.CCA_DATA.DOMAINS.forEach((d) => (pd[d.id] = { correct: 0, total: 0 }));
  return pd;
}

function ScreenPractice({ practice }) {
  const P = window.CCA_PRACTICE;
  const st = practice.state;
  const [sub, setSub] = usesS("hub"); // hub | runner | results | history | leaderboard
  const [review, setReview] = usesS(null);
  const [current, setCurrent] = usesS(0);
  const [now, setNow] = usesS(Date.now());
  const [signInOpen, setSignInOpen] = usesS(false);
  const [postOpen, setPostOpen] = usesS(false);
  const [pendingTimed, setPendingTimed] = usesS(false);

  const prevActive = userS(st.active?.id || null);

  // route to runner whenever an attempt is active
  useeS(() => {
    if (st.active && !st.active.submitted) {
      setSub("runner");
      setCurrent(0);
    }
  }, [st.active?.id]);

  // detect submit/discard transitions
  useeS(() => {
    const cur = st.active?.id || null;
    if (prevActive.current && !cur) {
      const top = st.attempts[0];
      if (top && top.id === prevActive.current) {
        setReview(top);
        setSub("results");
      } else {
        setSub("hub");
      }
    }
    prevActive.current = cur;
  }, [st.active, st.attempts]);

  // timed countdown + auto-submit
  useeS(() => {
    const a = st.active;
    if (!a || a.mode !== "timed" || a.submitted) return;
    const id = setInterval(() => {
      const left = Math.ceil((a.createdAt + a.durationMs - Date.now()) / 1000);
      setNow(Date.now());
      if (left <= 0) {
        clearInterval(id);
        practice.submit();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [st.active?.id]);

  const secondsLeft =
    st.active && st.active.mode === "timed"
      ? Math.max(0, Math.ceil((st.active.createdAt + st.active.durationMs - now) / 1000))
      : null;

  const stats = usemS(() => {
    const attempts = st.attempts;
    if (!attempts.length)
      return { attempts: 0, best: 0, bestPass: false, last: null, perDomain: emptyPerDomain() };
    const best = attempts.reduce((b, a) => (a.score.pct > b.score.pct ? a : b));
    const last = attempts.slice().sort((a, b) => b.submittedAt - a.submittedAt)[0];
    return {
      attempts: attempts.length,
      best: best.score.pct,
      bestPass: best.score.pass,
      last: last.score.pct,
      perDomain: best.score.perDomain,
    };
  }, [st.attempts]);

  const board = usemS(() => {
    const seed = P.SEED_LEADERBOARD.map((e) => ({ ...e }));
    let all = seed;
    if (st.posted) all = [...seed, { ...st.posted, isYou: true }];
    all.sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date));
    return all;
  }, [st.posted]);

  const yourBest = usemS(() => {
    const b = bestTimed(st.attempts);
    return b ? b.score.pct : null;
  }, [st.attempts]);

  // ---- actions ----
  function handleStart(mode) {
    if (mode === "timed" && !st.user) {
      setPendingTimed(true);
      setSignInOpen(true);
      return;
    }
    practice.startAttempt(mode);
  }
  function doSignIn(handle) {
    practice.signIn(handle);
    setSignInOpen(false);
    if (pendingTimed) {
      setPendingTimed(false);
      setTimeout(() => practice.startAttempt("timed"), 0);
    }
  }
  function handleSubmit() {
    const a = st.active;
    if (!a) return;
    const unanswered = a.instances.length - Object.keys(a.answers).length;
    if (unanswered > 0 && a.mode === "timed") {
      if (!window.confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) return;
    }
    practice.submit();
  }
  function handleExit() {
    if (window.confirm("Exit and discard this attempt? Your progress will be lost.")) {
      practice.discardActive();
    }
  }

  // ---- runner is full-focus ----
  if (sub === "runner" && st.active) {
    return (
      <div className="screen pe-screen pe-screen-runner">
        <ExamRunner
          attempt={st.active}
          current={current}
          secondsLeft={secondsLeft}
          onSelect={(pos) => practice.select(current, pos)}
          onFlag={() => practice.flag(current)}
          onNav={(i) => setCurrent(i)}
          onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
          onNext={() => setCurrent((c) => Math.min(st.active.instances.length - 1, c + 1))}
          onSubmit={handleSubmit}
          onExit={handleExit}
        />
      </div>
    );
  }

  return (
    <div className="screen pe-screen">
      {/* sub-nav */}
      <div className="pe-subnav">
        <div className="pe-tabs">
          {[
            { id: "hub", label: "Overview" },
            { id: "history", label: "History" },
            { id: "leaderboard", label: "Leaderboard" },
          ].map((tb) => (
            <button
              key={tb.id}
              className={`pe-tab ${sub === tb.id || (sub === "results" && tb.id === "hub") ? "is-active" : ""}`}
              onClick={() => setSub(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div className="pe-auth">
          {st.user ? (
            <>
              <span className="pe-auth-who"><span className="pe-auth-dot" />{st.user.handle}</span>
              <button className="ghost-btn-sm" onClick={() => practice.signOut()}>Sign out</button>
            </>
          ) : (
            <button className="ghost-btn-sm" onClick={() => setSignInOpen(true)}>Sign in</button>
          )}
        </div>
      </div>

      {sub === "hub" ? (
        <PracticeHub
          stats={stats}
          signedIn={!!st.user}
          user={st.user}
          onStart={handleStart}
          onSignIn={() => { setPendingTimed(true); setSignInOpen(true); }}
          onGoto={(v) => setSub(v)}
        />
      ) : null}

      {sub === "results" && review ? (
        <ResultsReview
          attempt={review}
          posted={st.posted}
          onPost={() => setPostOpen(true)}
          onRetake={() => handleStart(review.mode)}
          onHome={() => setSub("hub")}
          onLeaderboard={() => setSub("leaderboard")}
        />
      ) : null}

      {sub === "history" ? (
        <HistoryView
          attempts={st.attempts}
          onOpen={(a) => { setReview(a); setSub("results"); }}
          onStart={() => setSub("hub")}
        />
      ) : null}

      {sub === "leaderboard" ? (
        <LeaderboardView
          board={board}
          you={st.posted}
          yourBest={yourBest}
          onOpenPost={() => setPostOpen(true)}
          onUnpost={() => { if (window.confirm("Remove your score from the leaderboard?")) practice.unpost(); }}
        />
      ) : null}

      {signInOpen ? (
        <SignInModal
          onClose={() => { setSignInOpen(false); setPendingTimed(false); }}
          onSignIn={doSignIn}
        />
      ) : null}

      {postOpen ? (
        <PostModal
          score={yourBest}
          defaultHandle={st.posted?.handle && st.posted.handle !== "Anonymous" ? st.posted.handle : st.user?.handle || ""}
          defaultAnon={st.posted?.anon || false}
          onClose={() => setPostOpen(false)}
          onPost={(handle, anon) => { practice.postToLeaderboard(handle, anon); setPostOpen(false); setSub("leaderboard"); }}
        />
      ) : null}
    </div>
  );
}

function SignInModal({ onClose, onSignIn }) {
  const [handle, setHandle] = usesS("");
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="card modal pe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pe-modal-head">
          <h2 className="modal-title">Sign in</h2>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        <p className="pe-modal-sub">Timed exams and the leaderboard require an account. Practice mode works without one.</p>
        <label className="pe-field">
          <span className="pe-field-label">Display name</span>
          <input
            className="pe-input"
            placeholder="e.g. mohammed"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            autoFocus
          />
        </label>
        <div className="pe-modal-foot">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={() => onSignIn(handle.trim() || "you")}>Sign in →</button>
        </div>
        <div className="pe-modal-note">Mock sign-in for this prototype — no real account is created.</div>
      </div>
    </div>
  );
}

function PostModal({ score, defaultHandle, defaultAnon, onClose, onPost }) {
  const [handle, setHandle] = usesS(defaultHandle || "");
  const [anon, setAnon] = usesS(defaultAnon || false);
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="card modal pe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pe-modal-head">
          <h2 className="modal-title">Post to leaderboard</h2>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        <p className="pe-modal-sub">
          Posting your best timed score (<strong>{score}%</strong>) is opt-in. Choose how you appear — you can remove it anytime.
        </p>
        <label className={`pe-field ${anon ? "is-disabled" : ""}`}>
          <span className="pe-field-label">Display handle</span>
          <input
            className="pe-input"
            placeholder="your handle"
            value={anon ? "" : handle}
            disabled={anon}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <label className="pe-toggle">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          <span className="pe-toggle-box" />
          <span>Post as <strong>Anonymous</strong></span>
        </label>
        <div className="pe-modal-foot">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={() => onPost(handle.trim() || "you", anon)}>
            {anon ? "Post anonymously →" : "Post →"}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPractice, SignInModal, PostModal });
