import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  FolderTree,
  Gauge,
  Keyboard,
  Lock,
  Search,
  Sparkles,
  Terminal,
  Check,
  Clock3,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/repolens/SiteHeader";
import { SocialDock } from "@/components/repolens/SocialDock";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/primitives";
import { parseGitHubInput } from "@/lib/parse";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { EXAMPLE_REPOS, REPO_URL, SITE } from "@/lib/site";
import { cn } from "@/utils/cn";
import { clearRecentRepos, getRecentRepos } from "@/lib/recent";

const FEATURES = [
  {
    tag: "File Tree",
    icon: <FolderTree className="h-4 w-4" />,
    title: "Virtual IDE file explorer",
    body: "Virtualized nested tree with expand/collapse, filter search, and 1-click copyable ASCII directory trees.",
    preview: (
      <div className="mt-3 rounded-lg border border-line/70 bg-surface-2/60 p-2 font-mono text-[10px] text-faint">
        <p className="text-muted"><span className="text-accent">├──</span> src/</p>
        <p className="pl-3 text-muted"><span className="text-accent">├──</span> components/ <span className="text-ok">✓</span></p>
        <p className="pl-3 text-faint">└── App.tsx</p>
      </div>
    ),
  },
  {
    tag: "Navigation",
    icon: <Search className="h-4 w-4" />,
    title: "Raycast-style fuzzy quick open",
    body: "Press Ctrl/Cmd + P to instantly fuzzy-search thousands of files across any repository with zero lag.",
    preview: (
      <div className="mt-3 flex items-center justify-between rounded-lg border border-line/70 bg-surface-2/60 px-2.5 py-1.5 font-mono text-[11px]">
        <span className="text-muted"><span className="text-accent">Button</span>.tsx</span>
        <span className="rounded bg-accent/20 px-1 py-0.2 text-[9px] text-accent">98% match</span>
      </div>
    ),
  },
  {
    tag: "Analysis",
    icon: <Compass className="h-4 w-4" />,
    title: "Automated architecture layers",
    body: "Files mapped into UI, state, core, infra and test layers with architectural health signals — computed in-browser.",
    preview: (
      <div className="mt-3 flex gap-1.5 font-mono text-[9px]">
        <span className="rounded border border-accent-border/60 bg-accent-soft px-1.5 py-0.5 text-accent">UI 38%</span>
        <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-muted">Core 24%</span>
        <span className="rounded border border-ok/30 bg-ok/10 px-1.5 py-0.5 text-ok">Tests 18%</span>
      </div>
    ),
  },
  {
    tag: "Metrics",
    icon: <Gauge className="h-4 w-4" />,
    title: "Instant codebase insights",
    body: "Accurate language breakdown, heaviest directories, largest files, package manifests, and commit activity.",
    preview: (
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-surface-2 border border-line/40">
        <div style={{ width: "62%" }} className="bg-[#3178c6]" title="TypeScript 62%" />
        <div style={{ width: "24%" }} className="bg-[#f59e0b]" title="CSS 24%" />
        <div style={{ width: "14%" }} className="bg-[#4ade80]" title="JSON 14%" />
      </div>
    ),
  },
  {
    tag: "Workflow",
    icon: <Keyboard className="h-4 w-4" />,
    title: "Keyboard-first workflow",
    body: "Navigate without reaching for the mouse. Toggle panels, copy permalinks, copy tree structures, and open in github.dev.",
    preview: (
      <div className="mt-3 flex items-center gap-1.5">
        <Kbd>⌘P</Kbd> <span className="text-[10px] text-faint">search</span>
        <Kbd>⌘B</Kbd> <span className="text-[10px] text-faint">tree</span>
        <Kbd>C</Kbd> <span className="text-[10px] text-faint">copy</span>
      </div>
    ),
  },
  {
    tag: "Privacy",
    icon: <Lock className="h-4 w-4" />,
    title: "100% Client-side & private",
    body: "No intermediary servers, no telemetry, no tracking. Requests flow directly between your browser and api.github.com.",
    preview: (
      <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-ok">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Direct GitHub API · Zero data retained
      </div>
    ),
  },
];

const STEPS = [
  { step: "01", title: "Paste URL or slug", body: "Paste any public GitHub repository link or owner/repo shorthand." },
  { step: "02", title: "Browse & inspect", body: "Browse files via virtualized tree, read syntax-highlighted code, or search instantly." },
  { step: "03", title: "Understand architecture", body: "Inspect layered structure, health signals, language share, and copy ASCII trees for docs or AI prompts." },
];

export function IndexPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState(getRecentRepos);
  const detected = useMemo(() => parseGitHubInput(value), [value]);

  const openParsed = (parsed: NonNullable<ReturnType<typeof parseGitHubInput>>) => {
    setError(null);
    void navigate({
      to: "/r/$owner/$repo/$",
      params: { owner: parsed.owner, repo: parsed.repo, _splat: parsed.path ?? "" },
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseGitHubInput(value);
    if (!parsed) {
      setError("That does not look like a GitHub repository. Try https://github.com/owner/repo");
      return;
    }
    openParsed(parsed);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] rl-grid-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />

      <SiteHeader active="home" />

      <main id="main" className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* ------------------------------------------------------------ hero */}
        <motion.section
          variants={stagger(0.08, 0.04)}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl pt-14 pb-4 text-center sm:pt-20"
        >
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-[11px] font-medium tracking-wide text-accent"
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            100% client-side · no sign-in · MIT licensed
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl"
          >
            Read any public GitHub repo
            <span className="block text-accent">like an IDE.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted sm:text-base">
            {SITE.description}
          </motion.p>

          <motion.form
            variants={fadeUp}
            onSubmit={submit}
            className="group relative mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-line-strong/80 bg-surface/90 p-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-200 focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/20 sm:flex-row"
            role="search"
          >
            <div className="relative flex flex-1 items-center">
              <Search
                className="pointer-events-none absolute left-3.5 h-4.5 w-4.5 text-faint transition-colors group-focus-within:text-accent"
                aria-hidden="true"
              />
              <input
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError(null);
                }}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text");
                  const parsed = parseGitHubInput(pasted);
                  if (!parsed) return;
                  event.preventDefault();
                  setValue(pasted.trim());
                  window.setTimeout(() => openParsed(parsed), 80);
                }}
                aria-label="GitHub repository URL"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "repo-input-error" : "repo-input-hint"}
                placeholder="Paste URL (e.g. https://github.com/facebook/react or vercel/next.js)"
                spellCheck={false}
                autoComplete="off"
                className="h-12 w-full rounded-xl bg-transparent pl-11 pr-24 text-sm font-mono text-ink placeholder:font-sans placeholder:text-faint focus:outline-none"
              />
              {detected ? (
                <div className="absolute right-3 flex items-center gap-1.5 rounded-md border border-ok/30 bg-ok/10 px-2 py-0.5 text-[11px] font-mono text-ok">
                  <Check className="h-3 w-3" />
                  <span className="hidden sm:inline">valid</span>
                </div>
              ) : value.trim() ? (
                <button
                  type="button"
                  onClick={() => setValue("")}
                  className="absolute right-3 rounded p-1 text-faint hover:text-ink"
                  aria-label="Clear input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="h-11 shrink-0 font-semibold sm:h-12"
              disabled={!detected}
            >
              <span>Explore repo</span>
              <Kbd>↵</Kbd>
            </Button>
          </motion.form>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.p
                id="repo-input-error"
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                role="alert"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-danger"
              >
                <X className="h-3.5 w-3.5" /> {error}
              </motion.p>
            ) : detected ? (
              <motion.p
                key="detected"
                id="repo-input-hint"
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-xs text-ok"
              >
                <Check className="h-3.5 w-3.5" /> Ready to explore {detected.owner}/{detected.repo}
                {detected.path ? <span className="text-faint">({detected.path})</span> : null}
              </motion.p>
            ) : (
              <motion.div
                key="hint"
                id="repo-input-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-faint"
              >
                <span>Sample repositories:</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.ul
            variants={fadeUp}
            className="mt-2.5 flex flex-wrap items-center justify-center gap-2"
          >
            {EXAMPLE_REPOS.map((example) => (
              <li key={example.label}>
                <Link
                  to="/r/$owner/$repo/$"
                  params={{ owner: example.owner, repo: example.repo, _splat: "" }}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-line/80 bg-surface/70 px-3 py-1.5 font-mono text-xs text-muted transition-all duration-150 hover:border-accent-border hover:bg-accent-soft/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="text-faint transition-colors group-hover:text-accent">/</span>
                  {example.label}
                </Link>
              </li>
            ))}
          </motion.ul>

          {recents.length ? (
            <motion.div variants={fadeUp} className="mx-auto mt-6 max-w-xl border-t border-line/70 pt-4">
              <div className="flex items-center justify-between text-[11px] text-faint">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-accent" />
                  <span>Recently explored</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentRepos();
                    setRecents([]);
                  }}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-faint transition-colors hover:text-ink"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
              <ul className="mt-2 flex flex-wrap justify-center gap-2">
                {recents.map((recent) => (
                  <li key={`${recent.owner}/${recent.repo}`}>
                    <Link
                      to="/r/$owner/$repo/$"
                      params={{ owner: recent.owner, repo: recent.repo, _splat: "" }}
                      title={recent.description ?? `${recent.owner}/${recent.repo}`}
                      className="inline-flex min-h-8 items-center rounded-lg border border-line/70 bg-surface-2/60 px-2.5 font-mono text-[11px] text-muted transition-colors duration-150 hover:border-accent-border hover:text-accent"
                    >
                      {recent.owner}/{recent.repo}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}

          {/* Interactive Workspace Mockup Preview */}
          <motion.div
            variants={fadeUp}
            className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-line-strong/90 bg-surface/95 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.8)] text-left rl-hairline-top"
          >
            <div className="flex items-center justify-between border-b border-line/80 bg-surface-2/70 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
                <span className="ml-2 font-mono text-[11px] text-muted">RepoLens Workspace · ashutoshpalhare/RepoLens</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
                <span className="inline-flex items-center gap-1 rounded border border-ok/30 bg-ok/10 px-1.5 py-0.5 text-ok">
                  <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Live
                </span>
                <span className="hidden sm:inline-block rounded border border-line px-1.5 py-0.5">main</span>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-line/60 sm:grid-cols-12 sm:divide-x sm:divide-y-0">
              {/* Mock Explorer */}
              <div className="hidden sm:col-span-3 sm:block p-3 font-mono text-[11px] space-y-1.5 bg-surface/50">
                <div className="text-[10px] uppercase tracking-wider text-faint font-semibold pb-1 flex items-center justify-between">
                  <span>Files</span>
                  <span className="text-[9px]">42 items</span>
                </div>
                <div className="text-muted flex items-center gap-1.5"><FolderTree className="h-3.5 w-3.5 text-accent" /> src/</div>
                <div className="pl-3 text-muted flex items-center gap-1.5"><FolderTree className="h-3.5 w-3.5 text-accent/80" /> components/</div>
                <div className="pl-6 text-accent flex items-center gap-1.5 bg-accent-soft/70 px-1.5 py-0.5 rounded border border-accent-border/40 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> App.tsx
                </div>
                <div className="pl-6 text-muted flex items-center gap-1.5">FileExplorer.tsx</div>
                <div className="pl-6 text-muted flex items-center gap-1.5">CodeViewer.tsx</div>
                <div className="pl-3 text-muted flex items-center gap-1.5"><FolderTree className="h-3.5 w-3.5 text-accent/80" /> lib/</div>
                <div className="pl-6 text-faint">analysis.ts</div>
                <div className="pl-6 text-faint">github.ts</div>
                <div className="text-muted flex items-center gap-1.5">package.json</div>
              </div>

              {/* Mock Editor */}
              <div className="sm:col-span-6 p-3.5 font-mono text-xs bg-bg/80">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-line/60 text-[11px]">
                  <span className="text-accent font-medium">src / components / App.tsx</span>
                  <span className="text-faint text-[10px]">TypeScript · 2.4 KB</span>
                </div>
                <div className="space-y-1 text-[11px] leading-relaxed select-none">
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">1</span><span className="text-accent">import</span> &#123; createRouter &#125; <span className="text-accent">from</span> <span className="text-ok">"@tanstack/react-router"</span>;</div>
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">2</span><span className="text-accent">import</span> &#123; analyzeRepo &#125; <span className="text-accent">from</span> <span className="text-ok">"@/lib/analysis"</span>;</div>
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">3</span></div>
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">4</span><span className="text-accent">export function</span> <span className="text-[#c4b5fd]">Workspace</span>() &#123;</div>
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">5</span>  <span className="text-accent">const</span> insights = <span className="text-[#c4b5fd]">useMemo</span>(() =&gt; <span className="text-[#c4b5fd]">analyzeRepo</span>(tree), [tree]);</div>
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">6</span>  <span className="text-accent">return</span> &lt;<span className="text-[#7dd3fc]">IDEView</span> layers=&#123;insights.layers&#125; /&gt;;</div>
                  <div className="text-faint"><span className="text-faint/60 select-none mr-2">7</span>&#125;</div>
                </div>
              </div>

              {/* Mock Insights/Architecture */}
              <div className="hidden sm:col-span-3 sm:block p-3 font-mono text-[11px] space-y-2 bg-surface/50">
                <div className="text-[10px] uppercase tracking-wider text-faint font-semibold pb-1 flex items-center justify-between">
                  <span>Architecture</span>
                  <span className="text-accent">Healthy ✓</span>
                </div>
                <div className="rounded border border-line bg-surface/80 p-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>UI Layer</span>
                    <span className="text-accent font-medium">42%</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: "42%" }} />
                  </div>
                </div>
                <div className="rounded border border-line bg-surface/80 p-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>Core Logic</span>
                    <span className="text-[#7dd3fc] font-medium">28%</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-[#7dd3fc]" style={{ width: "28%" }} />
                  </div>
                </div>
                <div className="rounded border border-line bg-surface/80 p-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>Test Coverage</span>
                    <span className="text-ok font-medium">20%</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-ok" style={{ width: "20%" }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* --------------------------------------------------------- features */}
        <section aria-labelledby="features" className="mt-20 sm:mt-24">
          <div className="text-center">
            <span className="rounded-full border border-accent-border/60 bg-accent-soft px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-accent">
              Core Capabilities
            </span>
            <h2 id="features" className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Engineered for code comprehension
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
              Built for the moments someone drops a repository link in Slack or PR reviews and you need to understand it in sixty seconds.
            </p>
          </div>

          <motion.ul
            variants={stagger(0.06, 0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <motion.li
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-surface/70 p-5",
                  "transition-all duration-200 hover:border-accent-border/70 hover:bg-surface/95 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] rl-hairline-top"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-border/50 bg-accent-soft text-accent">
                      {feature.icon}
                    </span>
                    <span className="rounded-md border border-line bg-surface-2/80 px-2 py-0.5 font-mono text-[10px] text-faint">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.body}</p>
                </div>
                {feature.preview}
              </motion.li>
            ))}
          </motion.ul>
        </section>

        {/* ------------------------------------------------------ how it works */}
        <section aria-labelledby="how" className="mt-20 sm:mt-24">
          <div className="text-center">
            <span className="rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-faint">
              Workflow
            </span>
            <h2 id="how" className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Three steps, zero setup
            </h2>
          </div>
          <motion.ol
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3"
          >
            {STEPS.map((step) => (
              <motion.li
                key={step.title}
                variants={fadeUp}
                className="relative rounded-2xl border border-line/80 bg-surface/70 p-5 rl-hairline-top hover:border-line-strong transition-colors"
              >
                <span className="font-mono text-xs font-semibold text-accent">{step.step}</span>
                <h3 className="mt-2 text-sm font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.body}</p>
              </motion.li>
            ))}
          </motion.ol>
        </section>

        {/* ---------------------------------------------------------- privacy */}
        <section className="mt-16 rounded-2xl border border-line bg-surface/70 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
                Your data never leaves the browser
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                RepoLens is a static app. It talks only to the public GitHub REST API and
                raw.githubusercontent.com — there is no server, no database and no analytics.
                Unauthenticated requests are limited to 60/hour by GitHub.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                How it works
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                <Terminal className="h-3.5 w-3.5" />
                View source
              </a>
            </div>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-faint">
            <span>Tip:</span>
            <Kbd>Ctrl/Cmd</Kbd>
            <span>+</span>
            <Kbd>P</Kbd>
            <span>quick open</span>
            <Kbd>?</Kbd>
            <span>all shortcuts (in the workspace)</span>
          </p>
        </section>
      </main>

      <footer className="relative border-t border-line bg-surface/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-xs text-faint">
            {SITE.name} · MIT · built by{" "}
            <a
              href="https://github.com/ashutoshpalhare"
              target="_blank"
              rel="noreferrer noopener"
              className="rl-link underline"
            >
              Ashutosh Palhare
            </a>
          </p>
          <SocialDock className="flex-row sm:flex-col" withMail={false} />
        </div>
      </footer>
    </div>
  );
}

export default IndexPage;
