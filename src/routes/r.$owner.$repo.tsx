import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Eye,
  FileCode2,
  FolderTree,
  Gauge,
  GitBranch,
  GitFork,
  HelpCircle,
  Moon,
  PanelLeft,
  PanelRight,
  Search,
  Settings,
  Star,
  Sun,
} from "lucide-react";
import {
  analyzeArchitectureIncremental,
  type ArchitectureReport,
  analyzeRepo,
  buildTree,
  formatBytes,
  formatCount,
  formatTreeAscii,
} from "@/lib/analysis";
import {
  fetchFileContent,
  fetchRepoMeta,
  fetchRepoTree,
  GitHubError,
  githubDevUrl,
  MAX_RENDER_BYTES,
  treeEntryUrl,
} from "@/lib/github";
import { copyText, useKeyboardShortcuts, useLocalState } from "@/lib/hooks";
import { EASE_OUT } from "@/lib/motion";
import { useThemeUI } from "@/lib/theme-provider";
import { rememberRepo } from "@/lib/recent";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/primitives";
import { Logo } from "@/components/repolens/SiteHeader";
import { FileExplorer } from "@/components/repolens/FileExplorer";
import { CodeViewer } from "@/components/repolens/CodeViewer";
import { InsightsPanel } from "@/components/repolens/InsightsPanel";
import { ArchitectureView } from "@/components/repolens/ArchitectureView";
import { OpenInMenu } from "@/components/repolens/OpenInMenu";
import { QuickOpenModal } from "@/components/repolens/QuickOpenModal";
import { ShortcutsModal } from "@/components/repolens/ShortcutsModal";
import { ErrorState, LoadingState } from "@/components/repolens/StateBlocks";
import { GitHubBudget, ResetCountdown } from "@/components/repolens/GitHubStatus";
import { SettingsModal } from "@/components/repolens/SettingsModal";

type CenterTab = "overview" | "code" | "architecture";
type MobileTab = "files" | "code" | "insights";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

export function WorkspacePage() {
  const params = useParams({ strict: false }) as {
    owner: string;
    repo: string;
    _splat?: string;
  };
  const { owner, repo } = params;
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { ref?: string };
  const requestedRef = typeof search.ref === "string" ? search.ref.trim() : "";
  const queryClient = useQueryClient();
  const { theme, toggle } = useThemeUI();
  const isDesktop = useIsDesktop();

  const selectedPath = params._splat && params._splat.trim() ? params._splat.trim() : null;
  const [centerTab, setCenterTab] = useState<CenterTab>(
    params._splat && params._splat.trim() ? "code" : "overview",
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("code");
  const [quickOpen, setQuickOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [architecture, setArchitecture] = useState<ArchitectureReport | null>(null);
  const [architectureProgress, setArchitectureProgress] = useState(0);
  const [architectureScanning, setArchitectureScanning] = useState(false);
  const [architectureCancelled, setArchitectureCancelled] = useState(false);
  const [architectureRun, setArchitectureRun] = useState(0);
  const architectureAbortRef = useRef<AbortController | null>(null);

  const [explorerOpen, setExplorerOpen] = useLocalState("explorerOpen", true);
  const [insightsOpen, setInsightsOpen] = useLocalState("insightsOpen", true);

  const filterRef = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------------------- fetching */

  const metaQuery = useQuery({
    queryKey: ["repo-meta", owner, repo],
    queryFn: ({ signal }) => fetchRepoMeta(owner, repo, signal),
  });

  const ref = requestedRef || metaQuery.data?.ref || "HEAD";
  const treeQuery = useQuery({
    queryKey: ["repo-tree", owner, repo, ref],
    queryFn: ({ signal }) => fetchRepoTree(owner, repo, ref, signal),
    enabled: Boolean(metaQuery.data),
  });

  const selectedItem = treeQuery.data?.items.find((item) => item.path === selectedPath);
  const selectedMissing = Boolean(
    selectedPath && treeQuery.data && !selectedItem && !treeQuery.data.truncated,
  );
  const selectedFilePath =
    selectedItem?.type === "blob" ||
    (Boolean(selectedPath) && !selectedItem && Boolean(treeQuery.data?.truncated))
      ? selectedPath
      : null;
  const codePath = selectedFilePath ?? (selectedMissing ? selectedPath : null);
  const selectedTooLarge = Boolean(
    selectedItem?.type === "blob" && selectedItem.size > MAX_RENDER_BYTES,
  );

  const fileQuery = useQuery({
    queryKey: ["repo-file", owner, repo, ref, selectedFilePath],
    queryFn: ({ signal }) => fetchFileContent(owner, repo, ref, selectedFilePath!, signal),
    enabled:
      Boolean(selectedFilePath) &&
      Boolean(metaQuery.data) &&
      Boolean(treeQuery.data) &&
      !selectedTooLarge,
  });

  /* ------------------------------------------------------------ analysis */

  const items = useMemo(() => treeQuery.data?.items ?? [], [treeQuery.data?.items]);
  // Deferred so a huge tree never blocks keystrokes or panel toggles.
  const deferredItems = useDeferredValue(items);
  const analysing = items.length !== deferredItems.length;
  const nodes = useMemo(() => buildTree(deferredItems), [deferredItems]);
  const insights = useMemo(() => analyzeRepo(deferredItems), [deferredItems]);
  const allPaths = useMemo(
    () => deferredItems.filter((i) => i.type === "blob").map((i) => i.path),
    [deferredItems],
  );

  const rootName = metaQuery.data ? `${owner}/${repo}` : repo;

  useEffect(() => {
    architectureAbortRef.current?.abort();
    if (!deferredItems.length) {
      setArchitecture(null);
      setArchitectureProgress(0);
      setArchitectureScanning(false);
      return;
    }

    const controller = new AbortController();
    architectureAbortRef.current = controller;
    setArchitecture(null);
    setArchitectureProgress(0);
    setArchitectureScanning(true);
    setArchitectureCancelled(false);
    void analyzeArchitectureIncremental(
      deferredItems,
      setArchitectureProgress,
      controller.signal,
    )
      .then((report) => {
        if (!controller.signal.aborted) setArchitecture(report);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setArchitectureCancelled(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setArchitectureScanning(false);
      });
    return () => controller.abort();
  }, [deferredItems, architectureRun]);

  /* ------------------------------------------------------------- actions */

  const openFile = (path: string) => {
    void navigate({
      to: "/r/$owner/$repo/$",
      params: { owner, repo, _splat: path },
      search: requestedRef ? { ref: requestedRef } : {},
    });
    setCenterTab("code");
    if (!isDesktop) setMobileTab("code");
  };

  const openTreeNode = (node: (typeof nodes)[number]) => {
    if (node.type === "symlink" || node.type === "submodule") {
      window.open(
        treeEntryUrl(owner, repo, ref, node.path, node.type),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    openFile(node.path);
  };

  // Route params are the source of truth, so browser back/forward restores files.
  useEffect(() => {
    if (codePath) setCenterTab("code");
    else setCenterTab("overview");
  }, [codePath]);

  const refreshAfterCredentialChange = () => {
    void queryClient.invalidateQueries({ queryKey: ["repo-meta", owner, repo] });
    void queryClient.invalidateQueries({ queryKey: ["repo-tree", owner, repo] });
    queryClient.removeQueries({ queryKey: ["repo-file", owner, repo] });
  };

  const reliabilityAction = (error: unknown) => {
    if (!(error instanceof GitHubError)) return undefined;
    if (!(["rate-limit", "auth", "not-found"] as const).includes(error.kind as "rate-limit" | "auth" | "not-found")) {
      return undefined;
    }
    return (
      <div className="flex flex-col items-center gap-2">
        {error.kind === "rate-limit" && error.resetAt ? (
          <p className="text-xs text-accent">
            Request budget resets in <ResetCountdown resetAt={error.resetAt} />
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-lg border border-accent-border bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
        >
          Open GitHub settings
        </button>
      </div>
    );
  };

  const focusFilter = () => {
    setExplorerOpen(true);
    if (!isDesktop) setMobileTab("files");
    window.setTimeout(() => filterRef.current?.focus(), 60);
  };

  const copyTree = () => {
    if (!nodes.length) {
      return;
    }
    void copyText(
      formatTreeAscii(nodes, { maxDepth: 2, rootName }),
      "Directory tree copied (depth 2)",
    );
  };

  const copyPath = () => {
    if (selectedPath) {
      void copyText(
        treeEntryUrl(owner, repo, ref, selectedPath, selectedItem?.type ?? "blob"),
        selectedItem?.type === "tree" ? "Directory permalink copied" : "File permalink copied",
      );
    } else {
      void copyText(`https://github.com/${owner}/${repo}`, "Repository URL copied");
    }
  };

  useKeyboardShortcuts({
    onQuickOpen: () => setQuickOpen(true),
    onFocusFilter: focusFilter,
    onToggleExplorer: () => setExplorerOpen((v) => !v),
    onToggleInsights: () => setInsightsOpen((v) => !v),
    onOpenGithubDev: () => window.open(githubDevUrl(owner, repo), "_blank", "noopener"),
    onCopyTree: copyTree,
    onCopyPath: copyPath,
    onHelp: () => setHelpOpen(true),
  });

  const showExplorer = isDesktop ? explorerOpen : mobileTab === "files";
  const showInsights = isDesktop ? insightsOpen : mobileTab === "insights";
  const showCenter = isDesktop || mobileTab === "code";

  useEffect(() => {
    const loaded = metaQuery.data;
    if (!loaded) return;
    rememberRepo({ owner, repo: loaded.repo, description: loaded.description });
  }, [owner, metaQuery.data]);

  /* --------------------------------------------------------- render: meta */

  if (metaQuery.isError) {
    const error = metaQuery.error instanceof GitHubError ? metaQuery.error : null;
    const title = error?.kind === "rate-limit"
      ? "GitHub API limit reached"
      : error?.kind === "not-found"
        ? "Repository not found"
        : error?.kind === "offline"
          ? "You are offline"
          : "Could not load this repository";
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState
          title={title}
          detail={(metaQuery.error as Error).message}
          onRetry={() => void metaQuery.refetch()}
          retryLabel="Retry"
          action={
            <div className="flex flex-col items-center gap-2">
              {error?.kind === "rate-limit" && error.resetAt ? (
                <p className="text-xs text-accent">
                  Request budget resets in <ResetCountdown resetAt={error.resetAt} />
                </p>
              ) : null}
              {(error?.kind === "rate-limit" || error?.kind === "not-found" || error?.kind === "auth") ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-lg border border-accent-border bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
                >
                  Open GitHub settings
                </button>
              ) : null}
              <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onCredentialChange={refreshAfterCredentialChange}
              />
            </div>
          }
        />
      </div>
    );
  }

  if (metaQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <LoadingState
          label={`Loading ${owner}/${repo}…`}
          detail="Fetching repository metadata from the public GitHub API."
        />
      </div>
    );
  }

  const meta = metaQuery.data!;

  /* ------------------------------------------------------------- chrome */

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/90 px-2.5 backdrop-blur-md sm:px-3">
        <Link
          to="/"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="RepoLens home"
        >
          <Logo />
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <Link
            to="/r/$owner/$repo/$"
            params={{ owner, repo, _splat: "" }}
            search={requestedRef ? { ref: requestedRef } : {}}
            className="truncate font-mono text-xs font-medium text-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="text-faint">{owner}/</span>
            <span className="text-ink font-semibold">{repo}</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-md border border-line-strong/80 bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
            <GitBranch className="h-3 w-3 text-accent" />
            <span>{ref}</span>
          </span>
          {meta.language ? (
            <Badge tone="neutral" dot>
              {meta.language}
            </Badge>
          ) : null}
          <span className="flex items-center gap-1 font-mono text-[11px] text-faint">
            <Star className="h-3 w-3 text-accent" /> {formatCount(meta.stars)}
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-faint">
            <GitFork className="h-3 w-3" /> {formatCount(meta.forks)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <GitHubBudget
            onOpenSettings={() => setSettingsOpen(true)}
            className="hidden md:inline-flex"
          />
          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            className={cn(
              "hidden h-8 items-center gap-2 rounded-lg border border-line px-2.5 text-xs text-faint transition-colors duration-150",
              "hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:flex",
            )}
            aria-label="Quick open a file"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Quick open</span>
            <span className="font-mono text-[10px]">⌘P</span>
          </button>

          <ToolbarToggle
            label="Toggle file explorer (Ctrl/Cmd + B)"
            onClick={() => setExplorerOpen((v) => !v)}
            active={explorerOpen && isDesktop}
          >
            <PanelLeft className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Toggle insights panel (Ctrl/Cmd + \)"
            onClick={() => setInsightsOpen((v) => !v)}
            active={insightsOpen && isDesktop}
          >
            <PanelRight className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle label="Keyboard shortcuts (?)" onClick={() => setHelpOpen(true)}>
            <HelpCircle className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle label="GitHub API settings" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggle}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </ToolbarToggle>
          <OpenInMenu
            owner={owner}
            repo={repo}
            branch={ref}
            filePath={selectedFilePath}
            className="hidden sm:block"
          />
        </div>
      </header>

      {/* Mobile-only repo strip so the context is always visible on phones */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-3 py-1.5 sm:hidden">
        <p className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[11px] text-muted">
          <span className="text-faint">{owner}/</span>
          <span className="truncate text-ink">{repo}</span>
          <span className="text-faint">@{ref}</span>
        </p>
        <OpenInMenu owner={owner} repo={repo} branch={ref} filePath={selectedFilePath} />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ------------------------------------------------------ explorer */}
        <AnimatePresence initial={false}>
          {showExplorer ? (
            <motion.aside
              key="explorer"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isDesktop ? 288 : "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="relative shrink-0 overflow-hidden border-r border-line"
              aria-label="File explorer"
            >
              <div className={cn("h-full", isDesktop ? "w-72" : "w-full")}>
                <FileExplorer
                  nodes={nodes}
                  rootName={rootName}
                  loading={treeQuery.isPending}
                  error={treeQuery.isError ? (treeQuery.error as Error).message : null}
                  errorAction={reliabilityAction(treeQuery.error)}
                  onRetry={() => void treeQuery.refetch()}
                  selectedPath={selectedPath}
                  onSelect={openTreeNode}
                  filterRef={filterRef}
                />
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        {/* -------------------------------------------------------- center */}
        {showCenter ? (
          <main id="main" className="flex min-w-0 flex-1 flex-col bg-surface-2/40">
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface px-2.5 py-1.5">
              <CenterTabButton
                active={centerTab === "overview"}
                onClick={() => setCenterTab("overview")}
                icon={<Gauge className="h-3.5 w-3.5" />}
                label="Overview"
              />
              <CenterTabButton
                active={centerTab === "code"}
                onClick={() => (codePath ? setCenterTab("code") : focusFilter())}
                icon={<FileCode2 className="h-3.5 w-3.5" />}
                label={codePath ? (codePath.split("/").pop() ?? "Code") : "Code"}
                badge={codePath ? codePath.split(".").pop() : undefined}
                disabled={!codePath}
              />
              <CenterTabButton
                active={centerTab === "architecture"}
                onClick={() => setCenterTab("architecture")}
                icon={<Compass className="h-3.5 w-3.5" />}
                label="Architecture"
                badge={architecture?.layers.length ? `${architecture.layers.length}` : undefined}
              />
              {treeQuery.data?.truncated ? (
                <Badge tone="warn" className="ml-1" title="GitHub truncated this very large recursive tree. Insights and architecture use the available entries and may be incomplete.">
                  partial tree
                </Badge>
              ) : null}
            </div>

            {treeQuery.data?.truncated ? (
              <div role="status" className="shrink-0 border-b border-accent-border bg-accent-soft px-3 py-2 text-xs leading-relaxed text-accent">
                GitHub truncated this very large recursive tree. Browsing still works, but insights,
                architecture, and search cover only the entries GitHub returned.
              </div>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={centerTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {centerTab === "architecture" ? (
                  <ArchitectureView
                    report={architecture}
                    loading={treeQuery.isPending || analysing || architectureScanning}
                    progress={architectureProgress}
                    onCancel={() => {
                      architectureAbortRef.current?.abort();
                      setArchitectureScanning(false);
                      setArchitectureCancelled(true);
                    }}
                    cancelled={architectureCancelled}
                    onRestart={() => setArchitectureRun((run) => run + 1)}
                    onOpenFile={openFile}
                  />
                ) : centerTab === "code" ? (
                  <CodeViewer
                    owner={owner}
                    repo={repo}
                    branch={ref}
                    path={codePath}
                    file={fileQuery.data}
                    loading={Boolean(selectedFilePath) && fileQuery.isPending}
                    error={selectedMissing
                      ? "This path does not exist on the selected ref."
                      : fileQuery.isError
                        ? (fileQuery.error as Error).message
                        : null}
                    errorAction={reliabilityAction(fileQuery.error)}
                    oversizedSize={selectedTooLarge ? selectedItem?.size : fileQuery.data?.oversized ? fileQuery.data.size : undefined}
                    entryType={selectedItem?.type}
                    onRetry={() => void fileQuery.refetch()}
                    onOpenInExplorer={focusFilter}
                  />
                ) : (
                  <Overview
                    description={meta.description}
                    homepage={meta.homepage}
                    license={meta.license}
                    language={meta.language}
                    loading={treeQuery.isPending}
                    error={treeQuery.isError ? (treeQuery.error as Error).message : null}
                    onRetry={() => void treeQuery.refetch()}
                    fileCount={insights.fileCount}
                    totalBytes={insights.totalBytes}
                    languages={insights.languages.slice(0, 6)}
                    onOpenFile={openFile}
                    onSeeArchitecture={() => setCenterTab("architecture")}
                    entryPoints={insights.entryPoints}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        ) : null}

        {/* ------------------------------------------------------ insights */}
        <AnimatePresence initial={false}>
          {showInsights ? (
            <motion.aside
              key="insights"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isDesktop ? 340 : "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="relative shrink-0 overflow-hidden border-l border-line"
              aria-label="Insights"
            >
              <div className={cn("h-full", isDesktop ? "w-[340px]" : "w-full")}>
                <InsightsPanel
                  meta={meta}
                  insights={insights}
                  nodes={nodes}
                  rootName={rootName}
                  loading={treeQuery.isPending}
                  error={treeQuery.isError ? (treeQuery.error as Error).message : null}
                  onRetry={() => void treeQuery.refetch()}
                  onSelectFile={openFile}
                />
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------ mobile tabs */}
      <nav
        aria-label="Workspace sections"
        className="flex shrink-0 items-stretch border-t border-line bg-surface lg:hidden"
      >
        {(
          [
            { id: "files", label: "Files", icon: <FolderTree className="h-4 w-4" /> },
            { id: "code", label: "Code", icon: <FileCode2 className="h-4 w-4" /> },
            { id: "insights", label: "Insights", icon: <Gauge className="h-4 w-4" /> },
          ] as const
        ).map((tab) => {
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors duration-150",
                active ? "text-accent" : "text-muted",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-tab-indicator"
                  className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-accent"
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                />
              ) : null}
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      <QuickOpenModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        paths={allPaths}
        loading={treeQuery.isPending}
        onSelect={openFile}
      />
      <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCredentialChange={refreshAfterCredentialChange}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function ToolbarToggle({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active
          ? "border-accent-border/60 bg-accent-soft text-accent shadow-[0_0_10px_-2px_var(--rl-accent-glow)]"
          : "border-transparent text-muted hover:border-line hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </motion.button>
  );
}

function CenterTabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        disabled
          ? "cursor-not-allowed text-faint/50 border-transparent"
          : active
            ? "border-line-strong bg-surface-2 text-ink shadow-sm"
            : "border-transparent text-muted hover:border-line hover:bg-surface-2/60 hover:text-ink",
      )}
    >
      <span className={active ? "text-accent" : "text-faint"}>{icon}</span>
      <span className="max-w-[18ch] truncate font-mono text-xs">{label}</span>
      {badge ? (
        <span
          className={cn(
            "rounded px-1 py-0.2 font-mono text-[10px]",
            active
              ? "bg-accent-soft text-accent border border-accent-border/50"
              : "bg-surface text-faint border border-line"
          )}
        >
          {badge}
        </span>
      ) : null}
      {active ? (
        <motion.span
          layoutId="center-tab-indicator"
          className="absolute inset-x-2 -bottom-[7px] h-[2px] rounded-full bg-accent shadow-[0_0_8px_var(--rl-accent)]"
          transition={{ duration: 0.22, ease: EASE_OUT }}
        />
      ) : null}
    </button>
  );
}

type OverviewProps = {
  description: string | null;
  homepage: string | null;
  license: string | null;
  language: string | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  fileCount: number;
  totalBytes: number;
  languages: { name: string; share: number; color: string; files: number }[];
  onOpenFile: (path: string) => void;
  onSeeArchitecture: () => void;
  entryPoints: string[];
};

function Overview({
  description,
  homepage,
  license,
  language,
  loading,
  error,
  onRetry,
  fileCount,
  totalBytes,
  languages,
  onOpenFile,
  onSeeArchitecture,
  entryPoints,
}: OverviewProps) {
  return (
    <div className="rl-scroll min-h-0 flex-1 overflow-auto p-4 sm:p-6">
      {error ? (
        <ErrorState title="Tree unavailable" detail={error} onRetry={onRetry} />
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="rounded-2xl border border-line-strong/80 bg-surface/90 p-5 sm:p-6 shadow-sm rl-hairline-top"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                <Eye className="h-3.5 w-3.5" /> Repository Overview
              </p>
              {homepage ? (
                <a
                  href={homepage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rl-link text-xs font-mono underline hover:text-accent-strong"
                >
                  {homepage.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
            </div>
            <h1 className="mt-2.5 text-lg sm:text-xl font-semibold tracking-tight text-ink leading-snug">
              {description ?? "No description provided."}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {language ? <Badge tone="accent" dot>{language}</Badge> : null}
              {license ? <Badge tone="neutral">License: {license}</Badge> : null}
              <Badge tone="neutral">{fileCount.toLocaleString()} files</Badge>
              <Badge tone="neutral">{formatBytes(totalBytes)}</Badge>
            </div>

            <div className="mt-5 pt-4 border-t border-line/60 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Explore file tree on the left, or dive into layered structure analysis:
              </p>
              <button
                type="button"
                onClick={onSeeArchitecture}
                className="inline-flex items-center gap-2 rounded-lg border border-accent-border/70 bg-accent-soft px-3.5 py-2 text-xs font-medium text-accent transition-all duration-150 hover:bg-accent hover:text-accent-contrast hover:shadow-sm"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Launch Architecture View</span>
              </button>
            </div>
          </motion.section>

          {loading ? (
            <LoadingState label="Building the file index…" />
          ) : (
            <>
              {languages.length ? (
                <section className="rounded-2xl border border-line bg-surface p-5">
                  <h2 className="text-sm font-semibold text-ink">Language mix</h2>
                  <ul className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full">
                    {languages.map((lang) => (
                      <li
                        key={lang.name}
                        style={{ width: `${lang.share * 100}%`, backgroundColor: lang.color }}
                        title={`${lang.name} · ${(lang.share * 100).toFixed(1)}%`}
                      />
                    ))}
                  </ul>
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {languages.map((lang) => (
                      <li
                        key={lang.name}
                        className="flex items-center gap-1.5 text-xs text-muted"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: lang.color }}
                        />
                        {lang.name}
                        <span className="font-mono text-faint">
                          {(lang.share * 100).toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {entryPoints.length ? (
                <section className="rounded-2xl border border-line bg-surface p-5">
                  <h2 className="text-sm font-semibold text-ink">Likely entry points</h2>
                  <ul className="mt-3 space-y-1">
                    {entryPoints.map((path) => (
                      <li key={path}>
                        <button
                          type="button"
                          onClick={() => onOpenFile(path)}
                          className="w-full truncate rounded-lg px-2 py-1.5 text-left font-mono text-xs text-ink transition-colors duration-150 hover:bg-surface-2 hover:text-accent focus-visible:bg-surface-2 focus-visible:outline-none"
                        >
                          {path}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <p className="text-xs leading-relaxed text-faint">
                Files larger than {(MAX_RENDER_BYTES / 1000).toFixed(0)} KB are truncated for
                reading. Everything you see is fetched directly from GitHub — nothing is stored
                server-side.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkspacePage;
