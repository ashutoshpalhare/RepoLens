import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Moon, ScanSearch, Settings2, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import { GitHubStatus } from "@/components/repolens/GitHubStatus";
import { OpenInMenu } from "@/components/repolens/OpenInMenu";
import { SettingsModal } from "@/components/repolens/SettingsModal";
import { ErrorBlock, LoadingBlock } from "@/components/repolens/StateBlocks";
import { useRepo } from "@/hooks/useRepoData";
import { useTheme } from "@/hooks/useTheme";
import { rememberRepo } from "@/lib/recent";
import { useEffect } from "react";

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (query.data?.meta) {
      rememberRepo({
        owner,
        repo,
        description: query.data.meta.description,
      });
    }
  }, [owner, repo, query.data?.meta]);

  const onCredentialChange = useCallback(() => {
    void query.refetch();
  }, [query]);

  const branch = query.data?.meta.default_branch ?? "main";

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 sm:gap-3 sm:px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ScanSearch aria-hidden className="size-4 text-primary" />
          <span className="hidden sm:inline">RepoLens</span>
        </Link>

        <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />

        <h1 className="min-w-0 truncate font-mono text-sm text-foreground">
          {owner}/<span className="font-semibold">{repo}</span>
        </h1>

        {query.data && (
          <OpenInMenu
            owner={owner}
            repo={repo}
            branch={branch}
            className="hidden shrink-0 md:block"
          />
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
              className="rounded-md px-2 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm"
            >
              {t.label}
            </Link>
          ))}

          <GitHubStatus onOpenSettings={() => setSettingsOpen(true)} className="ml-1 hidden sm:inline-flex" />

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="GitHub API settings"
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <Settings2 aria-hidden className="size-4" />
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
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
          <ErrorBlock
            error={query.error}
            onRetry={() => query.refetch()}
            onOpenSettings={() => setSettingsOpen(true)}
            className="h-full"
          />
        ) : (
          <Outlet />
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCredentialChange={onCredentialChange}
      />
    </div>
  );
}
