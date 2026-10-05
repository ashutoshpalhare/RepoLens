import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Github, Layers, ScanSearch, Sparkles, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { SocialDock } from "@/components/repolens/SocialDock";
import { parseRepoInput } from "@/lib/github";
import { clearRecentRepos, getRecentRepos, type RecentRepo } from "@/lib/recent";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RepoLens — Read any GitHub repository at a glance" },
      {
        name: "description",
        content:
          "Paste a public GitHub repository URL and explore its files, source code, languages and module relationships in a fast IDE-like workspace.",
      },
      { property: "og:title", content: "RepoLens — Read any GitHub repository at a glance" },
      {
        property: "og:description",
        content:
          "Explore unfamiliar codebases visually: file tree, syntax-highlighted code, insights and architecture — no signup.",
      },
    ],
  }),
  component: Landing,
});

const SAMPLES = ["facebook/react", "vercel/next.js", "tailwindlabs/tailwindcss"];

function Landing() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentRepo[]>([]);

  useEffect(() => { setRecent(getRecentRepos()); }, []);

  const submit = (raw: string) => {
    const ref = parseRepoInput(raw);
    if (!ref) {
      setError("Enter a URL like https://github.com/owner/repo — or just owner/repo.");
      return;
    }
    setError(null);
    navigate({ to: "/r/$owner/$repo", params: ref });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-20rem] h-[42rem] w-[60rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-border/70 pb-5">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/8 text-primary">
              <ScanSearch className="size-4" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight">RepoLens</span>
            <span className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
              Repository intelligence
            </span>
          </Link>
          <Link to="/about" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            About →
          </Link>
        </header>

        <section className="mx-auto max-w-4xl pb-20 pt-20 text-center sm:pb-24 sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/6 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3" /> Understand code faster
          </div>

          <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-[5.4rem]">
            Read any repository
            <br />
            <span className="text-gradient-signal">like you wrote it.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Explore unfamiliar codebases without cloning them. Inspect files, read source,
            understand structure, and trace module relationships from one focused workspace.
          </p>

          <form className="mx-auto mt-10 max-w-2xl" onSubmit={(e) => { e.preventDefault(); submit(value); }}>
            <label htmlFor="repo" className="sr-only">GitHub repository URL</label>
            <div className="group rounded-xl border border-border bg-surface/90 p-1.5 shadow-2xl shadow-black/20 transition-all focus-within:border-primary/50">
              <div className="flex items-center gap-2">
                <Github className="ml-3 size-4 shrink-0 text-muted-foreground group-focus-within:text-primary" />
                <input
                  id="repo"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
                  placeholder="github.com/owner/repository"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!error}
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 font-mono text-sm outline-none placeholder:text-muted-foreground/55"
                />
                <button type="submit" className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-105">
                  Explore <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
            {error && <p role="alert" className="mt-2 text-left text-xs text-destructive">{error}</p>}
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>✓ Public repos</span><span>✓ No signup</span><span>✓ Runs in your browser</span>
            </div>
          </form>

          {recent.length > 0 && (
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="mb-2 flex items-center justify-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Recent</span>
                <button type="button" onClick={() => { clearRecentRepos(); setRecent([]); }} className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {recent.map((r) => (
                  <Link key={r.owner + "/" + r.repo} to="/r/$owner/$repo" params={{ owner: r.owner, repo: r.repo }}
                    className="rounded-md border border-border bg-surface/70 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground hover:border-primary/30 hover:text-foreground">
                    {r.owner}/{r.repo}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Try</span>
            {SAMPLES.map((s) => {
              const [owner, repo] = s.split("/") as [string, string];
              return <Link key={s} to="/r/$owner/$repo" params={{ owner, repo }}
                className="rounded-md border border-border/80 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-primary/30 hover:text-primary">{s}</Link>;
            })}
          </div>
        </section>

        <section className="mx-auto max-w-5xl pb-24">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/25">
            <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md border border-border bg-surface-2"><Folder className="size-3.5 text-primary" /></span>
                <span className="font-mono text-[10px] text-muted-foreground">facebook / react</span>
              </div>
              <div className="hidden gap-4 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:flex">
                <span>Code</span><span>Overview</span><span className="text-primary">Architecture</span>
              </div>
              <span className="font-mono text-[9px] text-primary">● Ready</span>
            </div>

            <div className="grid md:grid-cols-[190px_1fr_210px]">
              <div className="border-b border-border p-4 md:border-b-0 md:border-r">
                <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Explorer</div>
                <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  <div className="rounded bg-primary/6 px-2 py-1.5 text-primary">▾ packages</div>
                  <div className="px-2 py-1.5">▸ fixtures</div>
                  <div className="px-2 py-1.5">▸ scripts</div>
                  <div className="px-2 py-1.5">⌁ package.json</div>
                  <div className="px-2 py-1.5">⌁ README.md</div>
                </div>
              </div>

              <div className="border-b border-border bg-background/55 p-5 md:border-b-0 md:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">src/index.js</span>
                  <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] uppercase text-primary">JavaScript</span>
                </div>
                <pre className="overflow-hidden font-mono text-[10px] leading-[1.9] text-muted-foreground">
                  <code>
                    <span className="text-muted-foreground/50">01 </span><span className="text-primary">import</span> React <span className="text-primary">from</span> "react";{"\n"}
                    <span className="text-muted-foreground/50">02 </span><span className="text-primary">import</span> ReactDOM <span className="text-primary">from</span> "react-dom";{"\n"}
                    <span className="text-muted-foreground/50">03 </span>{"\n"}
                    <span className="text-muted-foreground/50">04 </span><span className="text-primary">const</span> root = ReactDOM.createRoot(...);{"\n"}
                    <span className="text-muted-foreground/50">05 </span>root.render(&lt;App /&gt;);{"\n"}
                    <span className="text-muted-foreground/50">06 </span>{"\n"}
                    <span className="text-muted-foreground/50">07 </span><span className="text-muted-foreground/60">// trace dependencies → understand flow</span>
                  </code>
                </pre>
              </div>

              <div className="p-5">
                <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Repository signal</div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-background/45 p-3"><div className="font-mono text-[8px] uppercase text-muted-foreground">Languages</div><div className="mt-1 text-xs font-medium">JS · C++ · Flow</div></div>
                  <div className="rounded-lg border border-border bg-background/45 p-3"><div className="font-mono text-[8px] uppercase text-muted-foreground">Files</div><div className="mt-1 text-xs font-medium">1,420</div></div>
                  <div className="rounded-lg border border-border bg-background/45 p-3"><div className="font-mono text-[8px] uppercase text-muted-foreground">Modules</div><div className="mt-1 text-xs font-medium">286 connected</div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">One workspace. Less context switching.</div>
        </section>

        <section className="mx-auto max-w-5xl border-t border-border/70 py-20">
          <div className="mb-8 max-w-xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Built for exploration</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Go from unfamiliar repo to useful context in minutes.</h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Layers, title: "File explorer", text: "Navigate the complete repository tree with fast filtering and familiar IDE-style interactions." },
              { icon: ScanSearch, title: "Repository insights", text: "See languages, file sizes, structure and the signals that matter before reading every file." },
              { icon: Boxes, title: "Architecture map", text: "Trace source-module relationships and understand how the codebase fits together." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="group rounded-xl border border-border bg-surface/70 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-surface">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-primary group-hover:border-primary/25 group-hover:bg-primary/5"><Icon className="size-4" /></div>
                <p className="mt-5 text-sm font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p>
                <div className="mt-5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground group-hover:text-primary">Explore →</div>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-border/70 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link to="/about" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">About RepoLens</Link>
              <p className="mt-2 text-xs text-muted-foreground">A focused way to understand unfamiliar code.</p>
            </div>
            <SocialDock />
          </div>
        </footer>
      </div>
    </main>
  );
}
