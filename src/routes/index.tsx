import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Github, Layers, ScanSearch } from "lucide-react";
import { useState } from "react";
import { SocialDock } from "@/components/repolens/SocialDock";
import { parseRepoInput } from "@/lib/github";

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
    <main className="grid-noise relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="animate-fade-up w-full max-w-2xl">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          <ScanSearch aria-hidden className="size-4 text-primary" />
          RepoLens
        </div>

        <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Read any repository <span className="text-gradient-signal">like you wrote it</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Paste a public GitHub repository. RepoLens loads the file tree, renders source with syntax
          highlighting, and analyses structure and imports entirely in your browser.
        </p>

        <form
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <label htmlFor="repo" className="sr-only">
            GitHub repository URL
          </label>
          <div className="panel flex items-center gap-2 p-2">
            <Github aria-hidden className="ml-2 size-4 shrink-0 text-muted-foreground" />
            <input
              id="repo"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://github.com/owner/repo"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Try
          </span>
          {SAMPLES.map((s) => {
            const [owner, repo] = s.split("/") as [string, string];
            return (
              <Link
                key={s}
                to="/r/$owner/$repo"
                params={{ owner, repo }}
                className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                {s}
              </Link>
            );
          })}
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Layers, title: "File explorer", text: "Folder tree, type icons, instant filter." },
            { icon: ScanSearch, title: "Insights", text: "Languages, sizes, largest files, structure." },
            { icon: Boxes, title: "Architecture", text: "Import relationships between source modules." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="panel p-4">
              <Icon aria-hidden className="size-4 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>

        <footer className="mt-16 border-t border-border pt-6">
          <Link
            to="/about"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            About RepoLens
          </Link>
          <SocialDock className="mt-5" />
        </footer>
      </div>
    </main>
  );
}
