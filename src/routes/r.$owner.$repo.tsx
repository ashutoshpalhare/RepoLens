import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Moon, ScanSearch, Sun } from "lucide-react";
import { ErrorBlock, LoadingBlock } from "@/components/repolens/StateBlocks";
import { useRepo } from "@/hooks/useRepoData";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/r/$owner/$repo")({
  head: ({ params }) => {
    const title = `${params.owner}/${params.repo} — RepoLens`;
    const description = `Explore the files, code, insights and architecture of ${params.owner}/${params.repo} in RepoLens.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Workspace,
});

const TABS = [
  { to: "/r/$owner/$repo", label: "Code", exact: true },
  { to: "/r/$owner/$repo/overview", label: "Overview", exact: false },
  { to: "/r/$owner/$repo/architecture", label: "Architecture", exact: false },
] as const;

function Workspace() {
  const { owner, repo } = Route.useParams();
  const { theme, toggle } = useTheme();
  const query = useRepo({ owner, repo });

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ScanSearch aria-hidden className="size-4 text-primary" />
          RepoLens
        </Link>

        <span aria-hidden className="h-5 w-px bg-border" />

        <h1 className="truncate font-mono text-sm text-foreground">
          {owner}/<span className="font-semibold">{repo}</span>
        </h1>
        {query.data && (
          <a
            href={query.data.meta.html_url}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary sm:flex"
          >
            GitHub <ExternalLink aria-hidden className="size-3" />
          </a>
        )}

        <nav aria-label="Workspace views" className="ml-auto flex items-center gap-1">
          {TABS.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              params={{ owner, repo }}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "bg-surface-2 text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {t.label}
            </Link>
          ))}
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="ml-1 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun aria-hidden className="size-4" />
            ) : (
              <Moon aria-hidden className="size-4" />
            )}
          </button>
        </nav>
      </header>

      <div className="min-h-0 flex-1">
        {query.isPending ? (
          <LoadingBlock label={`Loading ${owner}/${repo}…`} className="h-full" />
        ) : query.isError ? (
          <ErrorBlock error={query.error} onRetry={() => query.refetch()} className="h-full" />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
