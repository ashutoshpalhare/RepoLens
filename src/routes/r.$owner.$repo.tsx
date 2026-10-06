import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Command, GitBranch, Moon, ScanSearch, Settings2, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GitHubStatus } from "@/components/repolens/GitHubStatus";
import { OpenInMenu } from "@/components/repolens/OpenInMenu";
import { QuickOpenModal } from "@/components/repolens/QuickOpenModal";
import { SettingsModal } from "@/components/repolens/SettingsModal";
import { ShortcutsModal } from "@/components/repolens/ShortcutsModal";
import { ErrorBlock, LoadingBlock } from "@/components/repolens/StateBlocks";
import { useRepo } from "@/hooks/useRepoData";
import { useTheme } from "@/hooks/useTheme";
import { githubDevUrl } from "@/lib/github";
import { rememberRepo } from "@/lib/recent";

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

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

function Workspace() {
  const { owner, repo } = Route.useParams();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const query = useRepo({ owner, repo });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    if (query.data?.meta) {
      rememberRepo({
        owner,
        repo,
        description: query.data.meta.description,
      });
    }
  }, [owner, repo, query.data?.meta]);

  const filePaths = useMemo(() => {
    if (!query.data?.entries) return [];
    return query.data.entries.filter((e) => e.type === "blob").map((e) => e.path);
  }, [query.data?.entries]);

  const onCredentialChange = useCallback(() => {
    void query.refetch();
  }, [query]);

  const openFile = useCallback(
    (path: string) => {
      navigate({ to: "/r/$owner/$repo", params: { owner, repo } });
      window.dispatchEvent(new CustomEvent("repolens:open-file", { detail: { path } }));
    },
    [navigate, owner, repo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (settingsOpen || quickOpen || shortcutsOpen) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setQuickOpen(true);
        return;
      }

      if (e.key === "?" && !mod && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (e.key === "." && !mod && !e.altKey) {
        e.preventDefault();
        window.open(githubDevUrl(owner, repo), "_blank", "noopener,noreferrer");
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [owner, repo, settingsOpen, quickOpen, shortcutsOpen]);

  const branch = query.data?.meta.default_branch ?? "main";

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background grid-noise">
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/95 px-3 shadow-[0_1px_0_hsl(var(--primary)/0.03)] backdrop-blur sm:gap-3 sm:px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ScanSearch aria-hidden className="size-4 text-primary" />
          <span className="hidden sm:inline">RepoLens</span>
        </Link>

        <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />

        <div className="hidden items-center gap-1.5 rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground lg:flex">
          <GitBranch aria-hidden className="size-3 text-primary" /> {branch}
        </div>

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

        <nav aria-label="Workspace views" className="ml-auto flex items-center gap-1.5">
          {TABS.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              params={{ owner, repo }}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "bg-surface-2 text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="relative rounded-md border border-transparent px-2.5 py-1.5 text-xs font-medium transition-all hover:border-border hover:bg-background/50 sm:px-3 sm:text-sm"
            >
              {t.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            disabled={!query.data}
            title="Quick open (Ctrl/⌘ P)"
            className="hidden rounded-md border border-border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40 sm:inline-flex"
          >
            ⌘P
          </button>

          <GitHubStatus
            onOpenSettings={() => setSettingsOpen(true)}
            className="ml-1 hidden sm:inline-flex"
          />

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Shortcuts (?)"
            className="hidden rounded-md border border-border px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:inline-flex"
          >
            ?
          </button>

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

      <div className="relative min-h-0 flex-1 overflow-hidden">
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
      <QuickOpenModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        paths={filePaths}
        onSelect={openFile}
      />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}