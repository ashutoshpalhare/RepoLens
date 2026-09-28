import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ScanSearch } from "lucide-react";
import { SocialDock } from "@/components/repolens/SocialDock";

export const Route = createFileRoute("/about")({
  head: () => {
    const title = "About RepoLens — how it reads a repository";
    const description =
      "RepoLens is a client-side GitHub repository reader: file tree, syntax-highlighted code, language insights and import relationships, with no accounts or servers.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: About,
});

const POINTS = [
  {
    title: "Everything runs in your browser",
    text: "RepoLens talks straight to the public GitHub API. There is no server, no account and no data stored anywhere.",
  },
  {
    title: "Built for first contact with a codebase",
    text: "Explorer, code, insights and a module map sit side by side so you can form a mental model in minutes.",
  },
  {
    title: "Lightweight analysis, honest limits",
    text: "Import relationships come from scanning a sample of source files — fast and readable, not a compiler-level graph.",
  },
  {
    title: "Rate limits are shared",
    text: "GitHub allows 60 unauthenticated requests per hour per IP. Responses are cached in memory and limits are surfaced clearly.",
  },
];

function About() {
  return (
    <main className="grid-noise min-h-screen px-6 py-16">
      <div className="animate-fade-up mx-auto w-full max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back
        </Link>

        <div className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          <ScanSearch aria-hidden className="size-4 text-primary" />
          RepoLens
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A reading room for unfamiliar code
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Paste any public repository and RepoLens turns it into an IDE-like workspace you can skim:
          what files exist, what they contain, which languages dominate and how modules reference
          each other.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <li key={p.title} className="panel p-4">
              <p className="text-sm font-medium text-foreground">{p.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>

        <SocialDock className="mt-12" />
      </div>
    </main>
  );
}
