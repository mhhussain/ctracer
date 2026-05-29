/* global React, ReactDOM, Sidebar, Topbar, useStudyState,
   ScreenDashboard, ScreenBlueprint, ScreenPlan, ScreenCourses,
   ScreenProjects, ScreenDomain, ScreenReference, ScreenExamDay, ScreenPractice, usePracticeState,
   TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakButton, TweakSelect */
const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "indigo",
  "density": "comfortable"
}/*EDITMODE-END*/;

const SCREEN_LABELS = {
  home: { title: "Dashboard", sub: "Your CCA-F prep at a glance" },
  blueprint: { title: "Exam blueprint", sub: "5 domains · 60 questions · 120 minutes" },
  plan: { title: "Study plan", sub: "4-phase roadmap, ~47.5 hours hands-on" },
  courses: { title: "Courses", sub: "Anthropic Academy · free via Skilljar" },
  projects: { title: "Projects", sub: "Five builds covering every domain" },
  domain: { title: "Domain deep dive", sub: "Topics, builds, anti-patterns, study path" },
  reference: { title: "Quick reference", sub: "Glance before the exam" },
  practice: { title: "Practice exam", sub: "Timed exam · practice mode · leaderboard" },
  examday: { title: "Exam day", sub: "Final readiness check" },
};

function App() {
  const study = useStudyState();
  const practice = usePracticeState();
  const [route, setRoute] = useStateApp(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("domain:")) return { screen: "domain", domainId: hash.split(":")[1] };
    if (hash) return { screen: hash };
    return { screen: "home" };
  });
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // sync hash
  useEffectApp(() => {
    const h = route.screen === "domain" ? `domain:${route.domainId}` : route.screen;
    if (window.location.hash !== `#${h}`) {
      window.history.replaceState(null, "", `#${h}`);
    }
  }, [route]);

  // apply theme tweaks
  useEffectApp(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.accent = t.accent;
    document.documentElement.dataset.density = t.density;
  }, [t]);

  const navigate = (r) => setRoute(r);

  // overall progress
  const progress = useMemoApp(() => {
    const { PHASES } = window.CCA_DATA;
    const all = PHASES.flatMap((p) => p.tasks);
    const done = all.filter((t) => study.state.tasks[t.id]).length;
    const overall = Math.round((done / all.length) * 100);
    const hoursTotal = all.reduce((a, t) => a + t.hours, 0);
    const hoursDone = all.filter((t) => study.state.tasks[t.id]).reduce((a, t) => a + t.hours, 0);
    const activePhase =
      PHASES.find((p) => p.tasks.some((t) => !study.state.tasks[t.id])) ||
      PHASES[PHASES.length - 1];
    return {
      overall,
      hoursTotal,
      hoursDone,
      hoursLeft: Math.round(hoursTotal - hoursDone),
      phaseLabel: `Phase ${activePhase.num} · ${activePhase.name}`,
    };
  }, [study.state]);

  const screenInfo = SCREEN_LABELS[route.screen];
  let screenEl;
  switch (route.screen) {
    case "home":
      screenEl = <ScreenDashboard study={study} navigate={navigate} progress={progress} />; break;
    case "blueprint":
      screenEl = <ScreenBlueprint navigate={navigate} />; break;
    case "plan":
      screenEl = <ScreenPlan study={study} navigate={navigate} route={route} />; break;
    case "courses":
      screenEl = <ScreenCourses study={study} navigate={navigate} />; break;
    case "projects":
      screenEl = <ScreenProjects study={study} navigate={navigate} />; break;
    case "domain":
      screenEl = <ScreenDomain route={route} navigate={navigate} />; break;
    case "reference":
      screenEl = <ScreenReference />; break;
    case "practice":
      screenEl = <ScreenPractice practice={practice} />; break;
    case "examday":
      screenEl = <ScreenExamDay study={study} navigate={navigate} />; break;
    default:
      screenEl = <ScreenDashboard study={study} navigate={navigate} progress={progress} />;
  }

  // Domain header override
  const domainCtx = route.screen === "domain"
    ? window.CCA_DATA.DOMAINS.find((d) => d.id === route.domainId)
    : null;

  return (
    <>
      <div className="app" data-screen-label={`${route.screen}${route.domainId ? `:${route.domainId}` : ""}`}>
        <Sidebar route={route} navigate={navigate} progress={progress} />
        <main className="main">
          <Topbar
            title={domainCtx ? `Domain ${domainCtx.num} · ${domainCtx.short}` : screenInfo.title}
            sub={domainCtx ? `${domainCtx.weight}% of exam · ${domainCtx.questions} questions` : screenInfo.sub}
            right={
              <>
                <button className="top-btn" onClick={() => navigate({ screen: "reference" })}>
                  <span className="kbd">↗</span> Reference
                </button>
                <button className="top-btn primary" onClick={() => navigate({ screen: "examday" })}>
                  Exam day
                </button>
              </>
            }
          />
          {screenEl}
        </main>
      </div>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio
          label="Mode"
          value={t.theme}
          options={["dark", "light"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakSelect
          label="Accent"
          value={t.accent}
          options={["indigo", "amber", "teal", "rose"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "comfortable"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakSection label="Demo data" />
        <TweakButton onClick={() => study.seedDemo()}>Seed study progress</TweakButton>
        <TweakButton onClick={() => study.reset()}>Reset study progress</TweakButton>
        <TweakButton onClick={() => practice.seedDemo()}>Seed practice attempts</TweakButton>
        <TweakButton onClick={() => practice.reset()}>Reset practice data</TweakButton>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
