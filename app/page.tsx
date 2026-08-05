"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileSearch,
  Flame,
  Gauge,
  Grid2X2,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareCode,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Trophy,
  Upload,
  UserRound,
  UserPlus,
  Zap,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  clearSession,
  continueInterview,
  createSubmission,
  getCurrentUser,
  getProblem,
  getProblems,
  getSubmissions,
  hasStoredSession,
  login,
  logout,
  register,
  reviewCode,
  startInterview,
  type CodeReview,
  type InterviewMessage,
  type InterviewStage,
  type ProblemDetail,
  type ProblemSummary,
  type Submission,
  type User,
} from "./api";

const navItems = [
  { label: "Dashboard", icon: Grid2X2 },
  { label: "Practice", icon: Code2 },
  { label: "Mock Interview", icon: MessageSquareCode },
  { label: "Resume Analyzer", icon: FileSearch },
  { label: "Progress", icon: BarChart3 },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [practiceProblemSlug, setPracticeProblemSlug] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      if (!hasStoredSession()) return;
      try {
        setUser(await getCurrentUser());
      } catch {
        clearSession();
      }
    };

    restoreSession().finally(() => setSessionLoading(false));
  }, []);

  useEffect(() => {
    getProblems()
      .then((response) => {
        setProblems(response.content);
        setBackendOnline(true);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchQuery("");
        setSelectedSearchIndex(0);
        setProfileOpen(false);
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    document.getElementById(`global-search-result-${selectedSearchIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [searchOpen, selectedSearchIndex]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSubmissions()
      .then((response) => {
        if (cancelled) return;
        setSubmissions(response.content);
        setSubmissionCount(response.totalElements);
      })
      .catch(() => {
        if (cancelled) return;
        setSubmissions([]);
        setSubmissionCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (sessionLoading) return <LoadingScreen />;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;

  const metrics = buildLearningMetrics(submissions, problems);
  const featuredProblem =
    problems.find((problem) => problem.slug === submissions[0]?.problemSlug) ??
    problems.find((problem) => problem.slug === "longest-substring-without-repeating-characters") ??
    problems[0];
  const initials = user.fullName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const firstName = user.fullName.split(/\s+/)[0];
  const greeting = timeGreeting(new Date(), user.timezone);
  const searchResults = buildSearchResults(searchQuery, problems);

  const handleSubmissionCreated = (submission: Submission) => {
    setSubmissions((current) => [submission, ...current.filter((item) => item.id !== submission.id)]);
    setSubmissionCount((current) => current + 1);
  };

  const openSearch = () => {
    setSearchQuery("");
    setSelectedSearchIndex(0);
    setProfileOpen(false);
    setSearchOpen(true);
  };

  const openSearchResult = (result: GlobalSearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (result.type === "problem") {
      setPracticeProblemSlug(result.target);
      setActiveNav("Practice");
    } else {
      setActiveNav(result.target);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSearchIndex((current) => Math.min(current + 1, searchResults.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSearchIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter" && searchResults[selectedSearchIndex]) {
      event.preventDefault();
      openSearchResult(searchResults[selectedSearchIndex]);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setSubmissions([]);
      setSubmissionCount(0);
    }
  };

  return (
    <main className="app-shell">
      <button
        className="mobile-menu"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={21} />
      </button>

      {menuOpen && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {searchOpen && (
        <div className="search-overlay" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search InterviewOS" onMouseDown={(event) => event.stopPropagation()}>
            <div className="search-input-row">
              <Search size={20} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedSearchIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages, problems, or DSA concepts..."
                aria-label="Search pages and problems"
                aria-controls="global-search-results"
              />
              <kbd>ESC</kbd>
            </div>
            <div className="search-results" id="global-search-results" role="listbox">
              <div className="search-results-heading">
                <span>{searchQuery.trim() ? "SEARCH RESULTS" : "QUICK ACCESS"}</span>
                <small>{searchResults.length} available</small>
              </div>
              {searchResults.length === 0 ? (
                <div className="search-empty"><Search size={22} /><strong>No results found</strong><p>Try a problem title, topic, difficulty, or workspace page.</p></div>
              ) : searchResults.map((result, index) => {
                const ResultIcon = result.type === "problem"
                  ? Code2
                  : navItems.find((item) => item.label === result.target)?.icon ?? Grid2X2;
                return (
                  <button
                    key={result.id}
                    id={`global-search-result-${index}`}
                    className={index === selectedSearchIndex ? "search-result selected" : "search-result"}
                    onMouseEnter={() => setSelectedSearchIndex(index)}
                    onClick={() => openSearchResult(result)}
                    role="option"
                    aria-selected={index === selectedSearchIndex}
                  >
                    <span className="search-result-icon"><ResultIcon size={18} /></span>
                    <span className="search-result-copy"><strong>{result.title}</strong><small>{result.description}</small></span>
                    <span className="search-result-type">{result.type === "problem" ? "Problem" : "Page"}</span>
                    <ArrowRight size={15} />
                  </button>
                );
              })}
            </div>
            <footer className="search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></footer>
          </section>
        </div>
      )}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <span className="brand-mark"><Code2 size={21} /></span>
          <span className="brand">InterviewOS <b>AI</b></span>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={activeNav === label ? "nav-item active" : "nav-item"}
              onClick={() => {
                setActiveNav(label);
                setMenuOpen(false);
              }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <button className="nav-item settings-item" onClick={handleLogout}>
          <LogOut size={19} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>

        <div className="plan-card">
          <div className="plan-kicker"><Sparkles size={15} /> Early access</div>
          <strong>Builder plan</strong>
          <p>Unlimited practice insights during beta.</p>
          <button>View plan <ArrowRight size={14} /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="status-line">
            <span className="terminal-icon"><Terminal size={16} /></span>
            <span>System status:</span>
            <strong className={backendOnline ? "" : "offline"}><i /> {backendOnline ? "API connected" : "API unavailable"}</strong>
          </div>

          <div className="top-actions">
            <button className="search-button" aria-label="Search pages and problems" onClick={openSearch}>
              <Search size={17} />
              <span>Search anything</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="date-chip"><CalendarDays size={16} /> {formatHeaderDate(new Date(), user.timezone)}</div>
            <div className="profile-menu-wrap">
              <button
                className="profile-button"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((current) => !current)}
                title={user.email}
              >
                <span>{initials}</span>
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <span className="profile-menu-avatar">{initials}</span>
                    <div className="profile-menu-user">
                      <strong>{user.fullName}</strong>
                      <span>{user.email}</span>
                      <small><i /> Authenticated account</small>
                    </div>
                  </div>

                  <div className="profile-details">
                    <div><span>Role</span><strong>{titleCase(user.role)}</strong></div>
                    <div><span>Language</span><strong>{titleCase(user.preferredLanguage)}</strong></div>
                    <div><span>Timezone</span><strong>{user.timezone}</strong></div>
                    <div><span>Member since</span><strong>{formatMonth(user.createdAt)}</strong></div>
                  </div>

                  <div className="profile-workspace">
                    <div className="profile-workspace-title">
                      <span><Code2 size={15} /> InterviewOS workspace</span>
                      <small>{backendOnline ? "LIVE" : "OFFLINE"}</small>
                    </div>
                    <p>Java 21 + Spring Boot + PostgreSQL interview preparation platform.</p>
                    <div className="profile-metrics">
                      <div><strong>{problems.length}</strong><span>DSA problems</span></div>
                      <div><strong>{submissionCount}</strong><span>Submissions</span></div>
                    </div>
                    <div className="profile-stack"><span>React</span><span>Spring Boot</span><span>PostgreSQL</span><span>JWT</span></div>
                  </div>

                  <div className="profile-menu-actions">
                    <button onClick={() => { setActiveNav("Practice"); setProfileOpen(false); }}><Code2 size={15} /> Open Practice</button>
                    <button className="profile-signout" onClick={handleLogout}><LogOut size={15} /> Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard">
          {activeNav !== "Dashboard" && (
            <FeaturePage
              active={activeNav}
              problems={problems}
              practiceProblemSlug={practiceProblemSlug}
              userInitials={initials}
              metrics={metrics}
              onSubmissionCreated={handleSubmissionCreated}
              onOpenPractice={(problemSlug) => {
                setPracticeProblemSlug(problemSlug);
                setActiveNav("Practice");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
          <div className={activeNav === "Dashboard" ? "" : "hidden-view"}>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">PERSONAL WORKSPACE / DASHBOARD</p>
              <h1>{greeting}, {firstName}</h1>
              <p className="welcome-copy">{metrics.totalAttempts === 0 ? "Your learning profile is ready for its first session." : "Keep your momentum. One focused session is ready."}</p>
            </div>
            <button className="secondary-action"><Gauge size={17} /> Take skill assessment</button>
          </div>

          <section className="overview-grid" aria-label="Daily overview">
            <article className="panel goal-panel">
              <div className="panel-heading">
                <span className="icon-box"><Target size={20} /></span>
                <div>
                  <p className="label">TODAY&apos;S GOAL</p>
                  <h2>Complete 3 practice attempts</h2>
                </div>
                <button
                  className={metrics.todayAttempts >= 3 ? "check-button checked" : "check-button"}
                  onClick={() => setActiveNav("Practice")}
                  aria-label={metrics.todayAttempts >= 3 ? "Daily goal complete" : "Open practice"}
                >
                  <Check size={17} />
                </button>
              </div>
              <div className="goal-progress-row">
                <div className="progress-track"><span style={{ width: `${metrics.todayGoalPercent}%` }} /></div>
                <strong>{metrics.todayGoalPercent}%</strong>
              </div>
              <p className="microcopy">{metrics.todayAttempts >= 3 ? "Daily target complete — excellent work." : `${metrics.todayAttempts} of 3 attempts completed today`}</p>
            </article>

            <article className="panel stat-card amber">
              <Flame size={21} />
              <strong>{metrics.currentStreak}</strong>
              <span>day streak</span>
              <small>Personal best: {metrics.bestStreak}</small>
            </article>

            <article className="panel stat-card">
              <Trophy size={21} />
              <strong>{metrics.attemptedProblems}</strong>
              <span>problems attempted</span>
              <small>{metrics.thisWeekAttempts} attempts this week</small>
            </article>

            <article className="panel stat-card">
              <TrendingUp size={21} />
              <strong>{metrics.weeklyGoalPercent}<span>%</span></strong>
              <span>weekly goal</span>
              <div className="mini-progress"><i style={{ width: `${metrics.weeklyGoalPercent}%` }} /></div>
            </article>

            <article className="panel stat-card muted-stat">
              <Clock3 size={21} />
              <strong>{formatDuration(metrics.thisWeekFocusMinutes)}</strong>
              <span>estimated practice</span>
              <small>This week</small>
            </article>
          </section>

          <section className="content-grid">
            <article className="panel problem-card">
              <div className="problem-topline">
                <span className="code-badge"><Code2 size={24} /></span>
                <div className="problem-heading">
                  <p className="label">{metrics.totalAttempts === 0 ? "START YOUR FIRST PROBLEM" : "CONTINUE WHERE YOU LEFT OFF"}</p>
                  <h2>{featuredProblem?.title ?? "Loading practice problems..."}</h2>
                </div>
                <button
                  className={bookmarked ? "bookmark-button saved" : "bookmark-button"}
                  onClick={() => setBookmarked(!bookmarked)}
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark problem"}
                >
                  <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="tag-row">
                {featuredProblem && <span className={`tag ${featuredProblem.difficulty.toLowerCase()}`}>{titleCase(featuredProblem.difficulty)}</span>}
                {featuredProblem?.topics.map((topic) => <span className="tag" key={topic.slug}>{topic.name}</span>)}
              </div>

              <p className="problem-copy">
                {featuredProblem?.description ?? "Connecting to the InterviewOS problem library."}
              </p>

              <div className="problem-metrics">
                <div><Clock3 size={17} /><span>Estimated time<strong>{featuredProblem?.estimatedMinutes ?? "--"} min</strong></span></div>
                <div><Activity size={17} /><span>Acceptance<strong>{featuredProblem?.acceptanceRate ?? "--"}%</strong></span></div>
                <div><Target size={17} /><span>Frequency<strong>{featuredProblem?.frequency ? titleCase(featuredProblem.frequency) : "--"}</strong></span></div>
              </div>

              <button className="primary-action" onClick={() => setActiveNav("Practice")}>
                <Play size={18} fill="currentColor" /> {metrics.totalAttempts === 0 ? "Start practice" : "Continue practice"} <ArrowRight size={18} />
              </button>
            </article>

            <div className="right-column">
              <article className="panel weak-panel">
                <div className="section-title">
                  <span><Target size={18} /> Topic coverage</span>
                  <button onClick={() => setActiveNav("Progress")}>View all <ChevronRight size={15} /></button>
                </div>
                {metrics.totalAttempts === 0 ? (
                  <div className="dashboard-empty-state"><Target size={20} /><strong>No topic data yet</strong><p>Submit your first practice attempt to begin tracking coverage.</p></div>
                ) : metrics.topicCoverage.slice(0, 2).map((topic) => (
                  <TopicRow key={topic.slug} title={topic.title} solved={`${topic.attempted} / ${topic.total} attempted`} score={topic.score} />
                ))}
              </article>

              <article className="panel activity-panel">
                <div className="section-title">
                  <span><CalendarDays size={18} /> Weekly activity</span>
                  <small>{metrics.thisWeekAttempts} attempts</small>
                </div>
                <div className="activity-grid">
                  {metrics.activityLevels.map((level, day) => (
                    <div className="day" key={day}>
                      <span>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day]}</span>
                      {[0, 1, 2, 3].map((block) => (
                        <i key={block} className={block < level ? "filled" : ""} />
                      ))}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span><i /> Live learning profile</span>
            <span>Last synced just now</span>
            <button><UserRound size={15} /> {user.fullName}</button>
          </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="auth-shell">
      <div className="auth-loading"><LoaderCircle size={24} /> Restoring your InterviewOS session...</div>
    </main>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const authenticatedUser = mode === "register"
        ? await register({ fullName, email, password })
        : await login({ email, password });
      onAuthenticated(authenticatedUser);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to reach the InterviewOS API");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((current) => current === "login" ? "register" : "login");
    setError("");
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand"><span className="brand-mark"><Code2 size={21} /></span> InterviewOS <b>AI</b></div>
        <p className="eyebrow">YOUR TECHNICAL INTERVIEW OPERATING SYSTEM</p>
        <h1>Practice with structure.<br />Interview with confidence.</h1>
        <p>Real problem data, persistent submissions, and a learning workspace built around your progress.</p>
        <div className="auth-feature-list">
          <span><CheckCircle2 size={16} /> Curated DSA practice library</span>
          <span><CheckCircle2 size={16} /> Secure JWT sessions</span>
          <span><CheckCircle2 size={16} /> Persistent submission history</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-icon">{mode === "register" ? <UserPlus size={22} /> : <ShieldCheck size={22} />}</span>
          <p className="eyebrow">{mode === "register" ? "CREATE YOUR WORKSPACE" : "WELCOME BACK"}</p>
          <h2>{mode === "register" ? "Start preparing" : "Sign in to InterviewOS"}</h2>
          <p>{mode === "register" ? "Create an account to save your practice history." : "Continue from your latest practice session."}</p>

          {mode === "register" && (
            <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={160} autoComplete="name" /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>

          {error && <div className="auth-error">{error}</div>}
          <button className="primary-action auth-submit" disabled={submitting}>
            {submitting ? <><LoaderCircle className="spin-icon" size={17} /> Connecting...</> : mode === "register" ? "Create account" : "Sign in"}
          </button>
          <button type="button" className="auth-switch" onClick={switchMode}>
            {mode === "register" ? "Already have an account? Sign in" : "New to InterviewOS? Create an account"}
          </button>
        </form>
      </section>
    </main>
  );
}

function FeaturePage({
  active,
  problems,
  practiceProblemSlug,
  userInitials,
  metrics,
  onSubmissionCreated,
  onOpenPractice,
}: {
  active: string;
  problems: ProblemSummary[];
  practiceProblemSlug: string;
  userInitials: string;
  metrics: LearningMetrics;
  onSubmissionCreated: (submission: Submission) => void;
  onOpenPractice: (problemSlug: string) => void;
}) {
  if (active === "Practice") return <PracticeWorkspace key={practiceProblemSlug || "practice"} problems={problems} initialSlug={practiceProblemSlug} onSubmissionCreated={onSubmissionCreated} />;
  if (active === "Mock Interview") {
    if (problems.length === 0) return <div className="feature-page"><PageHeader kicker="MOCK INTERVIEW / DSA" title="Preparing interview room" description="Loading high-frequency questions from the InterviewOS API..." /></div>;
    return <MockInterview problems={problems} userInitials={userInitials} onOpenWorkspace={onOpenPractice} />;
  }
  if (active === "Resume Analyzer") return <ResumeAnalyzer />;
  return <ProgressDashboard metrics={metrics} onStartPractice={() => onOpenPractice("")} />;
}

function PageHeader({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="feature-header">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function PracticeWorkspace({
  problems,
  initialSlug = "",
  onSubmissionCreated,
}: {
  problems: ProblemSummary[];
  initialSlug?: string;
  onSubmissionCreated: (submission: Submission) => void;
}) {
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [selectedConcept, setSelectedConcept] = useState("all");
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [language, setLanguage] = useState("JAVA");
  const [code, setCode] = useState("");
  const [runState, setRunState] = useState<"idle" | "running" | "passed">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<Submission | null>(null);
  const [codeReview, setCodeReview] = useState<CodeReview | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");

  const preferredProblem = problems.find((item) => item.slug === "longest-substring-without-repeating-characters");
  const effectiveSlug = selectedSlug || (preferredProblem ?? problems[0])?.slug || "";
  const conceptOptions = Array.from(
    new Map(
      problems
        .flatMap((item) => item.topics)
        .filter((topic) => topic.slug !== "system-design")
        .map((topic) => [topic.slug, topic.name] as const),
    ),
  )
    .map(([slug, name]) => ({ slug, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const conceptProblems = selectedConcept === "all"
    ? problems
    : problems.filter((item) => item.topics.some((topic) => topic.slug === selectedConcept));
  const rankedConceptProblems = [...conceptProblems].sort(compareImportantProblems);
  const selectedProblemSummary = rankedConceptProblems.find((item) => item.slug === effectiveSlug);
  const importantQuestions = selectedConcept === "all"
    ? selectedProblemSummary && !rankedConceptProblems.slice(0, 8).some((item) => item.slug === effectiveSlug)
      ? [selectedProblemSummary, ...rankedConceptProblems.slice(0, 7)]
      : rankedConceptProblems.slice(0, 8)
    : rankedConceptProblems;

  const selectProblem = (problemSlug: string) => {
    if (problemSlug === effectiveSlug) return;
    setProblem(null);
    setSelectedSlug(problemSlug);
    setError("");
    setReviewError("");
  };

  const selectConcept = (conceptSlug: string) => {
    setSelectedConcept(conceptSlug);
    const candidates = conceptSlug === "all"
      ? [...problems].sort(compareImportantProblems)
      : problems
          .filter((item) => item.topics.some((topic) => topic.slug === conceptSlug))
          .sort(compareImportantProblems);
    const nextProblem = candidates.find((item) => item.slug === effectiveSlug) ?? candidates[0];
    if (nextProblem) selectProblem(nextProblem.slug);
  };

  useEffect(() => {
    if (!effectiveSlug) return;
    let cancelled = false;
    getProblem(effectiveSlug)
      .then((detail) => {
        if (cancelled) return;
        const availableLanguages = Object.keys(detail.starterCode);
        const nextLanguage = availableLanguages.includes("JAVA") ? "JAVA" : availableLanguages[0] ?? "JAVA";
        setProblem(detail);
        setLanguage(nextLanguage);
        setCode(detail.starterCode[nextLanguage] ?? "");
        setRunState("idle");
        setLatestSubmission(null);
        setCodeReview(null);
        setReviewError("");
      })
      .catch((requestError) => {
        if (!cancelled) setError(apiErrorMessage(requestError));
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug]);

  useEffect(() => {
    getSubmissions()
      .then((response) => setSubmissions(response.content))
      .catch((requestError) => setError(apiErrorMessage(requestError)));
  }, []);

  const validateSolution = (): string | null => {
    if (!problem) return "Select a problem before checking your solution.";
    if (!code.trim()) return "Write or paste a solution before checking it.";
    if (code.trim() === (problem.starterCode[language] ?? "").trim()) {
      return "Modify the starter code with your solution before checking it.";
    }
    return null;
  };

  const runTests = async () => {
    const validationError = validateSolution();
    if (validationError || !problem) {
      setRunState("idle");
      setCodeReview(null);
      setReviewError(validationError ?? "Unable to check this solution.");
      return;
    }
    setRunState("running");
    setCodeReview(null);
    setReviewError("");
    setError("");
    try {
      setCodeReview(await reviewCode(problem.id, { language, sourceCode: code }));
      setRunState("passed");
    } catch (requestError) {
      setRunState("idle");
      setReviewError(apiErrorMessage(requestError));
    }
  };

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    setCode(problem?.starterCode[nextLanguage] ?? "");
    setRunState("idle");
    setCodeReview(null);
    setReviewError("");
  };

  const resetCode = () => {
    setCode(problem?.starterCode[language] ?? "");
    setRunState("idle");
    setCodeReview(null);
    setReviewError("");
  };

  const submitSolution = async () => {
    const validationError = validateSolution();
    if (validationError || !problem) {
      setLatestSubmission(null);
      setError(validationError ?? "Unable to submit this solution.");
      return;
    }
    const reviewRequest: Promise<CodeReview> = codeReview
      ? Promise.resolve(codeReview)
      : reviewCode(problem.id, { language, sourceCode: code });

    setSubmitting(true);
    setError("");
    setReviewError("");
    if (!codeReview) {
      setCodeReview(null);
      setRunState("running");
    }

    const [reviewResult, submissionResult] = await Promise.allSettled([
      reviewRequest,
      createSubmission(problem.id, { language, sourceCode: code }),
    ]);

    if (reviewResult.status === "fulfilled") {
      setCodeReview(reviewResult.value);
      setRunState("passed");
    } else {
      setRunState("idle");
      setReviewError(apiErrorMessage(reviewResult.reason));
    }

    if (submissionResult.status === "fulfilled") {
      const submission = submissionResult.value;
      setLatestSubmission(submission);
      setSubmissions((current) => [submission, ...current.filter((item) => item.id !== submission.id)]);
      onSubmissionCreated(submission);
    } else {
      setError(apiErrorMessage(submissionResult.reason));
    }

    setSubmitting(false);
  };

  const sampleResults = problem?.examples.slice(0, 3) ?? [];

  return (
    <div className="feature-page practice-page">
      <PageHeader
        kicker={`PRACTICE${problem?.topics[0] ? ` / ${problem.topics[0].name.toUpperCase()}` : ""}`}
        title={problem?.title ?? (effectiveSlug ? "Loading problem..." : "Choose a practice problem")}
        description={problem ? `${titleCase(problem.difficulty)} · ${problem.acceptanceRate ?? "--"}% acceptance · ${problem.estimatedMinutes ?? "--"} minutes` : "Problems are loaded from the InterviewOS API."}
        action={
          <div className="practice-header-actions">
            <select className="problem-selector" value={effectiveSlug} onChange={(event) => selectProblem(event.target.value)} aria-label="Select practice problem">
              {!effectiveSlug && <option value="">Loading problems...</option>}
              {conceptProblems.map((item) => <option key={item.id} value={item.slug}>{item.title} · {titleCase(item.difficulty)}</option>)}
            </select>
            <div className="practice-counter"><Flame size={16} /> {problems.length} questions</div>
          </div>
        }
      />

      {error && <div className="api-banner error-banner">{error}</div>}

      <section className="panel concept-library">
        <div className="concept-library-heading">
          <div><span><BrainCircuit size={18} /> DSA concepts</span><p>Select a concept to see its most important interview questions.</p></div>
          <small>{conceptOptions.length} concepts · ranked by interview frequency</small>
        </div>
        <div className="concept-chips" role="list" aria-label="DSA concepts">
          <button className={selectedConcept === "all" ? "active" : ""} onClick={() => selectConcept("all")}>All concepts</button>
          {conceptOptions.map((concept) => (
            <button key={concept.slug} className={selectedConcept === concept.slug ? "active" : ""} onClick={() => selectConcept(concept.slug)}>
              {concept.name}
              <span>{problems.filter((item) => item.topics.some((topic) => topic.slug === concept.slug)).length}</span>
            </button>
          ))}
        </div>
        <div className="important-questions-heading"><span><Sparkles size={16} /> Important interview questions</span><small>{rankedConceptProblems.length} available</small></div>
        <div className="important-question-grid">
          {importantQuestions.map((item) => (
            <button key={item.id} className={effectiveSlug === item.slug ? "important-question-card active" : "important-question-card"} onClick={() => selectProblem(item.slug)}>
              <span><i className={item.difficulty.toLowerCase()}>{titleCase(item.difficulty)}</i><b>{item.frequency ? `${titleCase(item.frequency)} frequency` : "Interview essential"}</b></span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="practice-layout">
        <section className="panel problem-description">
          <div className="section-title"><span><Code2 size={18} /> Problem</span>{problem && <span className={`tag ${problem.difficulty.toLowerCase()}`}>{titleCase(problem.difficulty)}</span>}</div>
          <p>{problem?.description ?? "Select a problem from the API library to begin."}</p>
          {problem?.examples.map((example) => (
            <div key={example.position}>
              <h3>Example {example.position}</h3>
              <pre>Input: {example.input}{`\n`}Output: {example.output}{example.explanation ? `\nExplanation: ${example.explanation}` : ""}</pre>
            </div>
          ))}
          <h3>Constraints</h3>
          <ul>{problem?.constraints?.split("\n").map((constraint) => <li key={constraint}><code>{constraint}</code></li>) ?? <li>Constraints unavailable.</li>}</ul>
          <div className="tag-row compact-tags">{problem?.topics.map((topic) => <span className="tag" key={topic.slug}>{topic.name}</span>)}</div>
        </section>

        <section className="panel editor-card">
          <div className="editor-toolbar">
            <span><i /> Solution.{languageExtension(language)}</span>
            <select aria-label="Programming language" value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {Object.keys(problem?.starterCode ?? { JAVA: "" }).map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
          </div>
          <div className="editor-wrap">
            <div className="line-numbers">{Array.from({ length: Math.max(1, code.split("\n").length) }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
            <textarea
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setLatestSubmission(null);
                setCodeReview(null);
                setReviewError("");
                setRunState("idle");
                setError("");
              }}
              spellCheck={false}
              aria-label="Code editor"
            />
          </div>
          <div className="editor-actions">
            <button className="reset-button" onClick={resetCode}><RotateCcw size={15} /> Reset</button>
            <button className="run-button" onClick={runTests} disabled={!problem || runState === "running" || submitting}><Play size={15} /> {runState === "running" ? "Reviewing..." : "Check solution"}</button>
            <button className="submit-button" onClick={submitSolution} disabled={!problem || submitting || runState === "running"}><Zap size={15} /> {submitting ? "Reviewing & saving..." : "Submit solution"}</button>
          </div>
        </section>
      </div>

      <div className="practice-bottom-grid">
        <section className="panel test-console">
          <div className="console-heading">
            <Terminal size={16} /> AI correctness review
            <span>{runState === "running" ? "Reviewing" : reviewError ? "Action required" : codeReview ? titleCase(codeReview.verdict) : "Ready"}</span>
          </div>
          {runState === "idle" && !reviewError && <p>Check or submit your solution against the problem, constraints, and {sampleResults.length} visible examples.</p>}
          {runState === "idle" && reviewError && (
            <div className="code-review-error">
              <strong><X size={16} /> Review not started</strong>
              <p>{reviewError}</p>
            </div>
          )}
          {runState === "running" && <p className="running-line"><i /> Gemini is reviewing syntax, logic, edge cases, and complexity...</p>}
          {runState === "passed" && codeReview && (
            <div className={`code-review-result verdict-${codeReview.verdict.toLowerCase()}`}>
              <strong>
                {codeReview.verdict === "LOOKS_CORRECT" ? <CheckCircle2 size={17} /> : <X size={17} />}
                {codeReview.verdict === "LOOKS_CORRECT"
                  ? "Code looks correct"
                  : codeReview.verdict === "INVALID"
                    ? "Code is incomplete"
                    : "Code needs changes"}
              </strong>
              <p><b>{codeReview.headline}.</b> {codeReview.summary}</p>
              {codeReview.issues.length > 0 && <ul>{codeReview.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
              <div><span>Time <b>{codeReview.timeComplexity}</b></span><span>Space <b>{codeReview.spaceComplexity}</b></span></div>
              <small>{codeReview.disclaimer}</small>
            </div>
          )}
        </section>

        <section className={latestSubmission ? "panel ai-review review-open" : "panel ai-review"}>
          <div className="console-heading"><BrainCircuit size={17} /> Submission API <span>Persisted in PostgreSQL</span></div>
          {!latestSubmission ? (
            <p>Submit your solution to start the AI review and save it to your authenticated history. Execution remains queued for the future judge worker.</p>
          ) : (
            <div className="review-content">
              <strong><CheckCircle2 size={16} /> Submission stored successfully</strong>
              <p>{latestSubmission.problemTitle} was saved at {formatDate(latestSubmission.submittedAt)}.</p>
              <div><span>Status</span><b>{titleCase(latestSubmission.status)}</b><span>Language</span><b>{titleCase(latestSubmission.language)}</b></div>
            </div>
          )}
        </section>
      </div>

      <section className="panel submission-history">
        <div className="section-title"><span><Clock3 size={18} /> Submission history</span><small>{submissions.length} recent</small></div>
        {submissions.length === 0 ? (
          <p className="history-empty">Your saved submissions will appear here.</p>
        ) : (
          <div className="history-list">
            {submissions.slice(0, 8).map((submission) => (
              <article key={submission.id}>
                <div><strong>{submission.problemTitle}</strong><small>{formatDate(submission.submittedAt)}</small></div>
                <span>{titleCase(submission.language)}</span>
                <b className={`submission-status status-${submission.status.toLowerCase()}`}>{titleCase(submission.status)}</b>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MockInterview({
  problems,
  userInitials,
  onOpenWorkspace,
}: {
  problems: ProblemSummary[];
  userInitials: string;
  onOpenWorkspace: (problemSlug: string) => void;
}) {
  const [selectedProblemSlug, setSelectedProblemSlug] = useState(() => initialInterviewProblemSlug(problems));
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [stage, setStage] = useState<InterviewStage>("CLARIFYING");
  const [sending, setSending] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sortedProblems = [...problems].sort(compareImportantProblems);
  const selectedProblem = problems.find((item) => item.slug === selectedProblemSlug) ?? null;

  const beginInterview = (problemSlug: string) => {
    const nextProblem = problems.find((item) => item.slug === problemSlug);
    if (!nextProblem) return;

    setSelectedProblemSlug(problemSlug);
    setMessages([]);
    setAnswer("");
    setStage("CLARIFYING");
    setSending(true);
    setError("");
  };

  useEffect(() => {
    if (!selectedProblemSlug) return;
    let cancelled = false;
    window.sessionStorage.setItem("interviewos.lastInterviewProblem", selectedProblemSlug);
    startInterview({ problemSlug: selectedProblemSlug, language: "JAVA" })
      .then((opening) => {
        if (cancelled) return;
        setMessages([{ speaker: "INTERVIEWER", text: opening.message }]);
        setStage(opening.stage);
      })
      .catch((requestError) => {
        if (!cancelled) setError(apiErrorMessage(requestError));
      })
      .finally(() => {
        if (!cancelled) setSending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProblemSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);

  const chooseNextProblem = () => {
    const nextProblemSlug = nextInterviewProblemSlug(problems, selectedProblemSlug);
    if (nextProblemSlug) beginInterview(nextProblemSlug);
  };

  const sendAnswer = async () => {
    const responseText = answer.trim();
    if (!responseText || sending || !selectedProblemSlug || messages.length === 0) return;

    const nextMessages: InterviewMessage[] = [...messages, { speaker: "USER", text: responseText }];
    setMessages(nextMessages);
    setAnswer("");
    setSending(true);
    setError("");

    try {
      const reply = await continueInterview({
        problemSlug: selectedProblemSlug,
        language: "JAVA",
        messages: nextMessages,
      });
      setMessages((current) => [...current, { speaker: "INTERVIEWER", text: reply.message }]);
      setStage(reply.stage);
    } catch (requestError) {
      setMessages(messages);
      setAnswer(responseText);
      setError(apiErrorMessage(requestError));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="feature-page">
      <PageHeader
        kicker="MOCK INTERVIEW / DSA"
        title="Interview room"
        description={selectedProblem ? `Adaptive Java interview · ${titleCase(selectedProblem.difficulty)} · ${selectedProblem.title}` : "Selecting a high-frequency interview question..."}
        action={<div className="timer-chip"><Clock3 size={16} /> 45 minute session</div>}
      />
      <div className="interview-grid">
        <section className="panel interview-brief">
          <div className="interviewer-card"><span><Bot size={21} /></span><div><strong>Aria</strong><small>AI Technical Interviewer</small></div><i>LIVE</i></div>
          <div className="interview-question-picker">
            <label>Interview question
              <select value={selectedProblemSlug} onChange={(event) => beginInterview(event.target.value)} disabled={sending || sortedProblems.length === 0}>
                {!selectedProblemSlug && <option value="">Selecting a question...</option>}
                {sortedProblems.map((item) => <option key={item.id} value={item.slug}>{item.title} · {titleCase(item.difficulty)}</option>)}
              </select>
            </label>
            <button onClick={chooseNextProblem} disabled={sending || sortedProblems.length < 2}><ChevronRight size={14} /> Next question</button>
          </div>
          <h2>{selectedProblem?.title ?? "Preparing your interview..."}</h2>
          <p>{selectedProblem?.description ?? "Aria is selecting a high-frequency problem from your DSA library."}</p>
          <div className="interview-rubric">
            <span><Check size={14} /> Clarify requirements</span>
            <span><Check size={14} /> Explain approach and trade-offs</span>
            <span><Check size={14} /> Write production-quality code</span>
          </div>
          <button className="secondary-action full-button" onClick={() => selectedProblem && onOpenWorkspace(selectedProblem.slug)} disabled={!selectedProblem}><Code2 size={16} /> Open coding workspace</button>
        </section>

        <section className="panel interview-chat">
          <div className="chat-header"><span><MessageSquareCode size={17} /> Interview conversation</span><span><i /> {sending ? "Aria is thinking" : titleCase(stage)}</span></div>
          <div className="messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={message.speaker === "INTERVIEWER" ? "message ai-message" : "message user-message"}>
                <span>{message.speaker === "INTERVIEWER" ? "AI" : userInitials}</span><p>{message.text}</p>
              </div>
            ))}
            {sending && <div className="message ai-message typing-message"><span>AI</span><p><LoaderCircle className="spin-icon" size={14} /> {messages.length === 0 ? "Aria is preparing a fresh opening question..." : "Aria is preparing the next question..."}</p></div>}
            <div ref={messagesEndRef} />
          </div>
          {error && <div className="chat-error"><X size={14} /> {error}</div>}
          <div className="chat-input">
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendAnswer();
                }
              }}
              placeholder="Explain your thinking out loud..."
              aria-label="Interview response"
              disabled={sending || messages.length === 0}
              maxLength={4000}
            />
            <button onClick={() => void sendAnswer()} aria-label="Send interview response" disabled={sending || !answer.trim() || messages.length === 0}>
              {sending ? <LoaderCircle className="spin-icon" size={17} /> : <Send size={17} />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ResumeAnalyzer() {
  const [fileName, setFileName] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <div className="feature-page">
      <PageHeader kicker="RESUME INTELLIGENCE" title="Resume analyzer" description="Compare your resume with a role and turn gaps into a focused interview plan." action={<div className="safe-chip"><ShieldCheck size={16} /> Private analysis</div>} />
      <div className="resume-grid">
        <section className="panel upload-card">
          <span className="upload-icon"><Upload size={27} /></span>
          <h2>{fileName || "Upload your resume"}</h2>
          <p>PDF only · Maximum 5 MB · Your file is used only for this analysis.</p>
          <label className="upload-button">Choose PDF<input type="file" accept="application/pdf" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /></label>
        </section>
        <section className="panel job-card">
          <div className="section-title"><span><BriefcaseBusiness size={18} /> Target role</span><button>Paste description</button></div>
          <div className="role-box"><strong>Software Engineer Intern</strong><span>Stripe · Bengaluru / Remote</span><small>Backend systems · APIs · Distributed systems</small></div>
          <button className="primary-action compact-action" disabled={!fileName} onClick={() => setAnalyzed(true)}><Sparkles size={17} /> Analyze job match</button>
        </section>
      </div>

      {analyzed ? (
        <section className="analysis-results">
          <article className="panel match-score"><div className="score-ring"><strong>78</strong><span>/ 100</span></div><div><p className="label">JOB-MATCH SCORE</p><h2>Strong foundation</h2><p>Your projects show API and automation experience. Add evidence of testing and system reliability.</p></div></article>
          <article className="panel insight-card"><h3>Top strengths</h3><span><CheckCircle2 size={15} /> Java and backend fundamentals</span><span><CheckCircle2 size={15} /> AI workflow experience</span><span><CheckCircle2 size={15} /> Deployed full-stack projects</span></article>
          <article className="panel insight-card warning-card"><h3>Missing signals</h3><span>Distributed systems</span><span>Automated testing</span><span>Database performance</span></article>
        </section>
      ) : (
        <section className="panel analyzer-empty"><BrainCircuit size={25} /><div><strong>What you&apos;ll receive</strong><p>Transparent match score, missing skills, improved bullet suggestions, and a personalized interview topic list.</p></div></section>
      )}
    </div>
  );
}

function ProgressDashboard({
  metrics,
  onStartPractice,
}: {
  metrics: LearningMetrics;
  onStartPractice: () => void;
}) {
  const nextTopic = metrics.topicCoverage.find((topic) => topic.attempted < topic.total) ?? metrics.topicCoverage[0];
  return (
    <div className="feature-page">
      <PageHeader kicker="LEARNING ANALYTICS / LAST 30 DAYS" title="Your progress" description="A clear view of momentum, skill coverage, and the highest-impact next steps." action={<button className="secondary-action"><CalendarDays size={16} /> Last 30 days</button>} />
      <div className="progress-summary">
        <article className="panel summary-card"><span>Practice attempts</span><strong>{metrics.last30Attempts}</strong><small><TrendingUp size={13} /> Last 30 days</small></article>
        <article className="panel summary-card"><span>Problems attempted</span><strong>{metrics.attemptedProblems}</strong><small>Unique questions in your history</small></article>
        <article className="panel summary-card"><span>Current streak</span><strong>{metrics.currentStreak}</strong><small>Personal best: {metrics.bestStreak} days</small></article>
        <article className="panel summary-card"><span>Estimated practice</span><strong>{formatDuration(metrics.last30FocusMinutes)}</strong><small>Based on attempted problem estimates</small></article>
      </div>
      <div className="progress-main-grid">
        <section className="panel topic-mastery">
          <div className="section-title"><span><Target size={18} /> Topic coverage</span><small>Based on {metrics.totalAttempts} attempts</small></div>
          {metrics.totalAttempts === 0 ? (
            <div className="progress-empty-state"><Target size={24} /><h2>No coverage data yet</h2><p>Topic progress begins after your first saved practice attempt.</p></div>
          ) : metrics.topicCoverage.slice(0, 6).map((topic) => (
            <div className="mastery-row" key={topic.slug}><span>{topic.title}</span><div><i style={{ width: `${topic.score}%` }} /></div><b>{topic.score}%</b></div>
          ))}
        </section>
        <section className="panel next-plan">
          <div className="section-title"><span><BrainCircuit size={18} /> Recommended next step</span><small>Live profile</small></div>
          <h2>{metrics.totalAttempts === 0 ? "Start your first practice problem" : `Build ${nextTopic?.title ?? "DSA"} coverage`}</h2>
          <p>{metrics.totalAttempts === 0 ? "Choose a DSA concept, work through one important interview question, and save your first attempt." : `You have attempted ${nextTopic?.attempted ?? 0} of ${nextTopic?.total ?? 0} available ${nextTopic?.title ?? "topic"} problems.`}</p>
          {(metrics.totalAttempts === 0
            ? ["Choose a DSA concept", "Work through the solution", "Submit to save progress"]
            : [`Review ${nextTopic?.title ?? "DSA"} fundamentals`, "Attempt the next recommended problem", "Submit to update your profile"]
          ).map((item, index) => <div className="plan-step" key={item}><span>{index + 1}</span><p>{item}</p><ChevronRight size={15} /></div>)}
          <button className="primary-action compact-action" onClick={onStartPractice}>{metrics.totalAttempts === 0 ? "Start first problem" : "Continue practice"}</button>
        </section>
      </div>
    </div>
  );
}

function TopicRow({ title, solved, score }: { title: string; solved: string; score: number }) {
  return (
    <button className="topic-row">
      <span className="topic-icon"><Activity size={19} /></span>
      <span className="topic-info">
        <strong>{title}</strong>
        <small>{solved}</small>
        <span className="topic-track"><i style={{ width: `${score}%` }} /></span>
      </span>
      <b>{score}%</b>
    </button>
  );
}

type TopicCoverage = {
  slug: string;
  title: string;
  attempted: number;
  total: number;
  score: number;
};

type GlobalSearchResult = {
  id: string;
  type: "page" | "problem";
  title: string;
  description: string;
  target: string;
};

type LearningMetrics = {
  totalAttempts: number;
  attemptedProblems: number;
  todayAttempts: number;
  todayGoalPercent: number;
  thisWeekAttempts: number;
  weeklyGoalPercent: number;
  last30Attempts: number;
  currentStreak: number;
  bestStreak: number;
  thisWeekFocusMinutes: number;
  last30FocusMinutes: number;
  activityLevels: number[];
  topicCoverage: TopicCoverage[];
};

function buildSearchResults(query: string, problems: ProblemSummary[]): GlobalSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const pageDescriptions: Record<string, string> = {
    Dashboard: "Overview of your goals, streak, and weekly activity",
    Practice: "Browse DSA concepts and solve interview questions",
    "Mock Interview": "Practice a responsive AI technical interview",
    "Resume Analyzer": "Analyze your resume against a target role",
    Progress: "Review attempts, topic coverage, and learning momentum",
  };
  const pageResults = navItems
    .filter((item) => {
      const searchableText = `${item.label} ${pageDescriptions[item.label]}`.toLowerCase();
      return !normalizedQuery || searchableText.includes(normalizedQuery);
    })
    .map((item) => ({
      id: `page-${item.label}`,
      type: "page" as const,
      title: item.label,
      description: pageDescriptions[item.label],
      target: item.label,
    }));
  const problemResults = [...problems]
    .sort(compareImportantProblems)
    .filter((problem) => {
      const searchableText = [
        problem.title,
        problem.description,
        problem.difficulty,
        problem.frequency ?? "",
        ...problem.topics.map((topic) => topic.name),
      ].join(" ").toLowerCase();
      return !normalizedQuery || searchableText.includes(normalizedQuery);
    })
    .map((problem) => ({
      id: `problem-${problem.id}`,
      type: "problem" as const,
      title: problem.title,
      description: `${titleCase(problem.difficulty)} · ${problem.topics.map((topic) => topic.name).join(" · ") || "DSA"}`,
      target: problem.slug,
    }));
  return [...pageResults, ...problemResults].slice(0, 10);
}

function buildLearningMetrics(submissions: Submission[], problems: ProblemSummary[]): LearningMetrics {
  const now = new Date();
  const today = startOfLocalDay(now);
  const weekStart = addLocalDays(today, -((today.getDay() + 6) % 7));
  const last30Start = addLocalDays(today, -29);
  const datedSubmissions = submissions
    .map((submission) => ({ submission, submittedAt: new Date(submission.submittedAt) }))
    .filter((item) => !Number.isNaN(item.submittedAt.getTime()));
  const todayKey = localDayKey(today);
  const todayAttempts = datedSubmissions.filter((item) => localDayKey(item.submittedAt) === todayKey).length;
  const weekSubmissions = datedSubmissions.filter((item) => item.submittedAt >= weekStart);
  const last30Submissions = datedSubmissions.filter((item) => item.submittedAt >= last30Start);
  const activeDayKeys = new Set(datedSubmissions.map((item) => localDayKey(item.submittedAt)));
  const activityLevels = Array.from({ length: 7 }, (_, index) => {
    const key = localDayKey(addLocalDays(weekStart, index));
    return Math.min(4, datedSubmissions.filter((item) => localDayKey(item.submittedAt) === key).length);
  });
  const attemptedProblemIds = new Set(submissions.map((submission) => submission.problemId));
  const estimatedMinutes = new Map(problems.map((problem) => [problem.id, problem.estimatedMinutes ?? 0]));

  const topicCoverage = Array.from(
    problems.reduce((coverage, problem) => {
      problem.topics.forEach((topic) => {
        const current = coverage.get(topic.slug) ?? { slug: topic.slug, title: topic.name, attempted: 0, total: 0, score: 0 };
        current.total += 1;
        if (attemptedProblemIds.has(problem.id)) current.attempted += 1;
        current.score = Math.round((current.attempted / current.total) * 100);
        coverage.set(topic.slug, current);
      });
      return coverage;
    }, new Map<string, TopicCoverage>()).values(),
  ).sort((left, right) => left.score - right.score || left.title.localeCompare(right.title));

  return {
    totalAttempts: submissions.length,
    attemptedProblems: attemptedProblemIds.size,
    todayAttempts,
    todayGoalPercent: Math.min(100, Math.round((todayAttempts / 3) * 100)),
    thisWeekAttempts: weekSubmissions.length,
    weeklyGoalPercent: Math.min(100, Math.round((weekSubmissions.length / 7) * 100)),
    last30Attempts: last30Submissions.length,
    currentStreak: currentActivityStreak(activeDayKeys, today),
    bestStreak: bestActivityStreak(activeDayKeys),
    thisWeekFocusMinutes: estimatedPracticeMinutes(weekSubmissions.map((item) => item.submission), estimatedMinutes),
    last30FocusMinutes: estimatedPracticeMinutes(last30Submissions.map((item) => item.submission), estimatedMinutes),
    activityLevels,
    topicCoverage,
  };
}

function estimatedPracticeMinutes(submissions: Submission[], estimatedMinutes: Map<string, number>): number {
  return Array.from(new Set(submissions.map((submission) => submission.problemId)))
    .reduce((total, problemId) => total + (estimatedMinutes.get(problemId) ?? 0), 0);
}

function currentActivityStreak(activeDayKeys: Set<string>, today: Date): number {
  let cursor = today;
  if (!activeDayKeys.has(localDayKey(cursor))) cursor = addLocalDays(cursor, -1);
  let streak = 0;
  while (activeDayKeys.has(localDayKey(cursor))) {
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return streak;
}

function bestActivityStreak(activeDayKeys: Set<string>): number {
  const days = Array.from(activeDayKeys)
    .map((key) => new Date(`${key}T00:00:00`))
    .sort((left, right) => left.getTime() - right.getTime());
  let best = 0;
  let current = 0;
  let previous: Date | null = null;
  days.forEach((day) => {
    current = previous && localDayDifference(previous, day) === 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day;
  });
  return best;
}

function localDayDifference(left: Date, right: Date): number {
  return Math.round((Date.UTC(right.getFullYear(), right.getMonth(), right.getDate()) - Date.UTC(left.getFullYear(), left.getMonth(), left.getDate())) / 86_400_000);
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addLocalDays(value: Date, days: number): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);
}

function localDayKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

function formatHeaderDate(value: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: timezone }).format(value);
}

function timeGreeting(value: Date, timezone: string): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(value));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function compareImportantProblems(left: ProblemSummary, right: ProblemSummary): number {
  const frequencyRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
  const difficultyRank = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
  const leftFrequency = left.frequency ? frequencyRank[left.frequency] : 3;
  const rightFrequency = right.frequency ? frequencyRank[right.frequency] : 3;
  return leftFrequency - rightFrequency
    || difficultyRank[left.difficulty] - difficultyRank[right.difficulty]
    || left.title.localeCompare(right.title);
}

function initialInterviewProblemSlug(problems: ProblemSummary[]): string {
  const previousProblem = typeof window === "undefined"
    ? ""
    : window.sessionStorage.getItem("interviewos.lastInterviewProblem") ?? "";
  return nextInterviewProblemSlug(problems, previousProblem);
}

function nextInterviewProblemSlug(problems: ProblemSummary[], currentProblemSlug: string): string {
  const rankedProblems = [...problems].sort(compareImportantProblems);
  if (rankedProblems.length === 0) return "";
  const currentIndex = rankedProblems.findIndex((item) => item.slug === currentProblemSlug);
  return rankedProblems[(currentIndex + 1) % rankedProblems.length].slug;
}

function languageExtension(language: string): string {
  if (language === "PYTHON") return "py";
  if (language === "JAVASCRIPT") return "js";
  if (language === "CPP") return "cpp";
  return "java";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function apiErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Unable to reach the InterviewOS API";
}
