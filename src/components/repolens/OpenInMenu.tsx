import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  Bot,
  ChevronDown,
  Compass,
  ExternalLink,
  FileCode2,
  FileText,
  GitCompareArrows,
  Headphones,
  History,
  Layers,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  SquareCode,
  Telescope,
  Terminal,
  Workflow,
} from "lucide-react";
import { GithubMark } from "@/components/ui/BrandIcons";
import {
  blameUrl,
  compareUrl,
  deepWikiUrl,
  fileUrl,
  gitDiagramUrl,
  github1sUrl,
  githubDevUrl,
  gitingestUrl,
  gitMcpUrl,
  gitPodcastUrl,
  gitReverseUrl,
  grepAppUrl,
  rawFileUrl,
  repoUrl,
  sourcegraphUrl,
  uithubUrl,
  vscodeCloneUrl,
} from "@/lib/github";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/utils/cn";

export type OpenInProps = {
  owner: string;
  repo: string;
  branch: string;
  /** currently open file path, if any */
  filePath?: string | null;
  className?: string;
};

type Item = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  icon: React.ReactNode;
  external: boolean;
  disabled?: boolean;
};

type Section = {
  id: string;
  title: string;
  items: Item[];
};

const SELECT_FILE_HINT = "Select a file first";

export function OpenInMenu({ owner, repo, branch, filePath, className }: OpenInProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasFile = Boolean(filePath);
  const fileHint = filePath ?? SELECT_FILE_HINT;

  const sections: Section[] = [
    {
      id: "github",
      title: "GitHub",
      items: [
        {
          id: "github",
          label: "Open on GitHub",
          hint: "Repository home",
          href: repoUrl(owner, repo),
          icon: <GithubMark className="h-4 w-4" />,
          external: true,
        },
        {
          id: "file",
          label: "Open current file on GitHub",
          hint: fileHint,
          href: filePath ? fileUrl(owner, repo, branch, filePath) : undefined,
          icon: <FileCode2 className="h-4 w-4" />,
          external: true,
          disabled: !hasFile,
        },
        {
          id: "blame",
          label: "Blame for current file",
          hint: hasFile ? "Line-by-line commit history" : SELECT_FILE_HINT,
          href: filePath ? blameUrl(owner, repo, branch, filePath) : undefined,
          icon: <History className="h-4 w-4" />,
          external: true,
          disabled: !hasFile,
        },
        {
          id: "raw",
          label: "Raw file",
          hint: hasFile ? "raw.githubusercontent.com" : SELECT_FILE_HINT,
          href: filePath ? rawFileUrl(owner, repo, branch, filePath) : undefined,
          icon: <FileText className="h-4 w-4" />,
          external: true,
          disabled: !hasFile,
        },
        {
          id: "compare",
          label: "Compare branches",
          hint: "Diff any two refs on GitHub",
          href: compareUrl(owner, repo),
          icon: <GitCompareArrows className="h-4 w-4" />,
          external: true,
        },
        {
          id: "githubdev",
          label: "Open in github.dev",
          hint: "Press . anywhere in RepoLens",
          href: githubDevUrl(owner, repo),
          icon: <Layers className="h-4 w-4" />,
          external: true,
        },
        {
          id: "vscode",
          label: "Open in VS Code Desktop",
          hint: "Clones the repo locally",
          href: vscodeCloneUrl(owner, repo),
          icon: <Terminal className="h-4 w-4" />,
          external: false,
        },
      ],
    },
    {
      id: "explore",
      title: "Explore",
      items: [
        {
          id: "github1s",
          label: "Open in github1s",
          hint: "VS Code in the browser (read-only)",
          href: github1sUrl(owner, repo),
          icon: <SquareCode className="h-4 w-4" />,
          external: true,
        },
        {
          id: "gitdiagram",
          label: "GitDiagram",
          hint: "Interactive system diagram",
          href: gitDiagramUrl(owner, repo),
          icon: <Workflow className="h-4 w-4" />,
          external: true,
        },
        {
          id: "sourcegraph",
          label: "Sourcegraph",
          hint: "Code intelligence & cross-refs",
          href: sourcegraphUrl(owner, repo),
          icon: <Telescope className="h-4 w-4" />,
          external: true,
        },
        {
          id: "grepapp",
          label: "grep.app",
          hint: "Fast regex search scoped to this repo",
          href: grepAppUrl(owner, repo),
          icon: <Search className="h-4 w-4" />,
          external: true,
        },
      ],
    },
    {
      id: "ai",
      title: "AI context",
      items: [
        {
          id: "gitingest",
          label: "Gitingest",
          hint: "Prompt-friendly text digest",
          href: gitingestUrl(owner, repo),
          icon: <Sparkles className="h-4 w-4" />,
          external: true,
        },
        {
          id: "uithub",
          label: "uithub",
          hint: "Flattened repo for LLM context",
          href: uithubUrl(owner, repo),
          icon: <Bot className="h-4 w-4" />,
          external: true,
        },
        {
          id: "deepwiki",
          label: "DeepWiki",
          hint: "AI-generated documentation",
          href: deepWikiUrl(owner, repo),
          icon: <BookOpenText className="h-4 w-4" />,
          external: true,
        },
        {
          id: "gitreverse",
          label: "GitReverse",
          hint: "Reverse-engineered build prompt",
          href: gitReverseUrl(owner, repo),
          icon: <Compass className="h-4 w-4" />,
          external: true,
        },
        {
          id: "gitmcp",
          label: "GitMCP",
          hint: "MCP server for AI assistants",
          href: gitMcpUrl(owner, repo),
          icon: <Plug className="h-4 w-4" />,
          external: true,
        },
        {
          id: "gitpodcast",
          label: "GitPodcast",
          hint: "Audio walkthrough of the repo",
          href: gitPodcastUrl(owner, repo),
          icon: <Headphones className="h-4 w-4" />,
          external: true,
        },
      ],
    },
  ];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          open
            ? "border-accent text-accent bg-accent-soft"
            : "border-line bg-surface-2/60 text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink",
        )}
      >
        <span>Open in…</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="Open repository in another tool"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="absolute right-0 z-50 mt-1.5 flex w-72 flex-col overflow-hidden rounded-xl border border-line-strong/80 bg-surface/95 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.85)] backdrop-blur-md rl-hairline-top"
          >
            <div className="rl-scroll max-h-[70vh] overflow-y-auto p-1.5">
              {sections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  role="group"
                  aria-label={section.title}
                  className={cn(sectionIndex > 0 && "mt-1 border-t border-line/70 pt-1.5")}
                >
                  <p className="px-2 pb-1 pt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-faint">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const disabled = item.disabled;
                    return (
                      <a
                        key={item.id}
                        role="menuitem"
                        aria-disabled={disabled}
                        tabIndex={disabled ? -1 : 0}
                        href={disabled ? undefined : item.href}
                        target={item.external && !disabled ? "_blank" : undefined}
                        rel={item.external ? "noreferrer noopener" : undefined}
                        onClick={(event) => {
                          if (disabled) {
                            event.preventDefault();
                            return;
                          }
                          if (!item.external) {
                            // Deep-link schemes (vscode://) navigate in this tab.
                            event.preventDefault();
                            window.location.href = item.href!;
                          }
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150",
                          disabled
                            ? "cursor-not-allowed opacity-40"
                            : "hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-none",
                        )}
                      >
                        <span className="mt-0.5 text-muted">{item.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                            {item.label}
                            {item.external ? <ExternalLink className="h-3 w-3 text-faint" /> : null}
                          </span>
                          {item.hint ? (
                            <span className="mt-0.5 block truncate font-mono text-[10px] text-faint">
                              {item.hint}
                            </span>
                          ) : null}
                        </span>
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>

            <p className="flex items-start gap-1.5 border-t border-line/70 bg-surface-2/60 px-3 py-2 text-[10px] leading-snug text-faint">
              <ShieldCheck className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
              Third-party tools open this public repo in a new tab; RepoLens shares nothing with them.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
