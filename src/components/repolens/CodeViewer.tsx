import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Copy, ExternalLink, FileCode2, FileWarning, WrapText } from "lucide-react";
import { Kbd } from "@/components/ui/primitives";
import type { FileContent, TreeItem } from "@/lib/github";
import { fileUrl, treeEntryUrl } from "@/lib/github";
import {
  highlightLines,
  languageFromPath,
  normalizeNewlines,
  type HighlightLine,
} from "@/lib/highlight";
import { formatBytes } from "@/lib/analysis";
import { copyText } from "@/lib/hooks";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/primitives";
import { EmptyState, ErrorState, LoadingState } from "./StateBlocks";

const CHUNK = 1500;

export type CodeViewerProps = {
  owner: string;
  repo: string;
  branch: string;
  path: string | null;
  file?: FileContent;
  loading?: boolean;
  error?: string | null;
  errorAction?: React.ReactNode;
  oversizedSize?: number;
  entryType?: TreeItem["type"];
  onRetry?: () => void;
  onOpenInExplorer?: () => void;
  className?: string;
};

export function CodeViewer({
  owner,
  repo,
  branch,
  path,
  file,
  loading,
  error,
  errorAction,
  oversizedSize,
  entryType,
  onRetry,
  onOpenInExplorer,
  className,
}: CodeViewerProps) {
  const [wrap, setWrap] = useState(false);
  const [visible, setVisible] = useState(CHUNK);
  const [copiedAction, setCopiedAction] = useState<"path" | "content" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setVisible(CHUNK);
    setCopiedAction(null);
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [owner, repo, branch, path]);

  useEffect(() => () => {
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
  }, []);

  const markCopied = (action: "path" | "content") => {
    setCopiedAction(action);
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopiedAction(null), 1800);
  };

  // Plain lines render immediately; Shiki tokens replace them once the lazy highlighter is ready.
  const lines = useMemo(() => {
    if (!file || file.binary || !file.text) return [];
    return normalizeNewlines(file.text).split("\n");
  }, [file]);

  // Tagged with the file they belong to, so a slow result can never paint over a newer file.
  const [highlighted, setHighlighted] = useState<{ source: FileContent; lines: HighlightLine[] } | null>(null);

  useEffect(() => {
    setHighlighted(null);
    if (!file || file.binary || !file.text) return;
    let cancelled = false;
    void highlightLines(file.text, file.path).then((result) => {
      if (!cancelled && result) setHighlighted({ source: file, lines: result });
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const tokenLines = highlighted && highlighted.source === file ? highlighted.lines : null;
  const language = path ? languageFromPath(path) : "text";

  const handleCopyPath = async () => {
    if (!path) return;
    const copied = await copyText(path, "File path copied");
    if (copied) markCopied("path");
  };

  const handleCopyContents = async () => {
    if (!file || file.binary || file.oversized) return;
    const copied = await copyText(file.text, "File contents copied");
    if (copied) markCopied("content");
  };

  if (!path) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center bg-surface/50", className)}>
        <div className="mx-auto max-w-sm rounded-2xl border border-line/80 bg-surface/80 p-6 shadow-sm rl-hairline-top">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border/40 bg-accent-soft text-accent">
            <FileCode2 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-ink">No file selected</h3>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Pick a file from the explorer on the left or press <Kbd>⌘P</Kbd> to fuzzy-search across the entire codebase.
          </p>

          <div className="mt-5 space-y-1.5 border-t border-line/60 pt-4 text-left font-mono text-[11px] text-faint">
            <div className="flex items-center justify-between">
              <span>Quick open</span>
              <span className="flex gap-1"><Kbd>⌘</Kbd><Kbd>P</Kbd></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Toggle explorer</span>
              <span className="flex gap-1"><Kbd>⌘</Kbd><Kbd>B</Kbd></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Copy tree</span>
              <Kbd>C</Kbd>
            </div>
          </div>

          {onOpenInExplorer ? (
            <button
              type="button"
              onClick={onOpenInExplorer}
              className="mt-5 inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-line-strong bg-surface-2 px-3 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Browse files in explorer
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const segments = path.split("/");
  const shown = lines.slice(0, visible);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-surface", className)}>
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line/80 bg-surface px-3 py-2">
        <nav aria-label="File path" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {segments.map((segment, index) => {
            const last = index === segments.length - 1;
            return (
              <span key={`${segment}-${index}`} className="flex shrink-0 items-center gap-1">
                <span
                  className={cn(
                    "font-mono text-xs",
                    last ? "text-accent font-semibold" : "text-muted hover:text-ink",
                  )}
                >
                  {segment}
                </span>
                {!last ? (
                  <ChevronRight className="h-3 w-3 text-faint/60" aria-hidden="true" />
                ) : null}
              </span>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {file && !file.binary ? (
            <Badge
              tone="neutral"
              className="hidden md:inline-flex font-mono text-[10px]"
              title={language === "text" ? "No grammar for this file type — shown as plain text" : "Highlighted with Shiki"}
            >
              {language === "text" ? "plain text" : language}
            </Badge>
          ) : null}
          {file ? (
            <Badge tone="neutral" className="hidden sm:inline-flex font-mono text-[10px]">
              {formatBytes(file.size)}
              {lines.length ? ` · ${lines.length.toLocaleString()} lines` : ""}
            </Badge>
          ) : null}
          {file?.truncated ? <Badge tone="warn">truncated</Badge> : null}
          <button
            type="button"
            onClick={handleCopyPath}
            aria-label="Copy file path"
            title="Copy file path (y)"
            className="flex h-7 items-center gap-1.5 rounded-md border border-line-strong/80 bg-surface-2/60 px-2 text-[11px] text-muted transition-colors duration-150 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {copiedAction === "path" ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{copiedAction === "path" ? "Copied" : "Path"}</span>
          </button>
          {file && !file.binary && !file.oversized ? (
            <button
              type="button"
              onClick={handleCopyContents}
              aria-label="Copy file contents"
              title="Copy entire file contents"
              className="flex h-7 items-center gap-1.5 rounded-md border border-line-strong/80 bg-surface-2/60 px-2 text-[11px] text-muted transition-colors duration-150 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {copiedAction === "content" ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
              <span className="hidden sm:inline">{copiedAction === "content" ? "Copied" : "Code"}</span>
            </button>
          ) : null}
          <a
            href={entryType === "submodule" || entryType === "symlink"
              ? treeEntryUrl(owner, repo, branch, path, entryType)
              : fileUrl(owner, repo, branch, path)}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open this file on GitHub (new tab)"
            title="Open this file on GitHub"
            className="flex h-7 items-center gap-1.5 rounded-md border border-line-strong/80 bg-surface-2/60 px-2 text-[11px] text-muted transition-colors duration-150 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button
            type="button"
            onClick={() => setWrap((v) => !v)}
            aria-pressed={wrap}
            aria-label="Toggle soft wrap"
            title="Toggle soft wrap"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md border border-line-strong/80 bg-surface-2/60 text-muted transition-colors duration-150 hover:border-accent hover:text-accent",
              wrap && "border-accent text-accent bg-accent-soft",
            )}
          >
            <WrapText className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="rl-scroll min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="min-w-full"
          >
            {loading ? (
              <LoadingState label={`Loading ${path.split("/").pop()}…`} />
            ) : error ? (
              <ErrorState title="Could not load this file" detail={error} onRetry={onRetry} action={errorAction} />
            ) : entryType === "symlink" || entryType === "submodule" ? (
              <EmptyState
                icon={<ExternalLink className="h-5 w-5" />}
                title={entryType === "submodule" ? "Git submodule" : "Symbolic link"}
                detail={`RepoLens does not fetch ${entryType}s as regular files because their target may live outside this tree.`}
                action={
                  <a
                    href={treeEntryUrl(owner, repo, branch, path, entryType)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Follow on GitHub
                  </a>
                }
              />
            ) : oversizedSize ? (
              <EmptyState
                icon={<FileWarning className="h-5 w-5" />}
                title="File is too large to render safely"
                detail={`${formatBytes(oversizedSize)} exceeds RepoLens's ${formatBytes(1_500_000)} browser preview limit.`}
                action={
                  <a
                    href={fileUrl(owner, repo, branch, path)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open on GitHub
                  </a>
                }
              />
            ) : !file ? (
              <EmptyState title="Nothing to show" />
            ) : file.binary ? (
              <EmptyState
                icon={<FileWarning className="h-5 w-5" />}
                title="Binary or unsupported file"
                detail={`${formatBytes(file.size)} — open it on GitHub to preview.`}
              />
            ) : file.text.length === 0 ? (
              <EmptyState title="Empty file" detail="This file contains no text." />
            ) : (
              <table className="rl-code w-full border-collapse font-mono text-[12.5px] leading-[1.65]">
                <tbody>
                  {shown.map((line, index) => (
                    <tr key={index} className="group transition-colors duration-75 hover:bg-surface-2/90">
                      <td
                        className={cn(
                          "select-none border-r border-line/60 px-2.5 text-right align-top text-faint/60 tabular-nums text-xs group-hover:text-faint",
                          "sticky left-0 bg-surface w-[1%] min-w-[3.5rem]",
                        )}
                      >
                        {index + 1}
                      </td>
                      <td
                        className={cn(
                          "px-3.5 align-top text-ink selection:bg-accent/30",
                          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
                        )}
                      >
                        {tokenLines?.[index]?.length ? (
                          tokenLines[index]!.map((token, tokenIndex) => (
                            <span
                              key={tokenIndex}
                              className="rl-tok"
                              style={token.style as CSSProperties | undefined}
                            >
                              {token.content}
                            </span>
                          ))
                        ) : (
                          line || " "
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {file && !file.binary && lines.length > visible ? (
              <div className="flex items-center justify-center gap-3 border-t border-line px-4 py-4">
                <span className="text-xs text-faint">
                  Showing {visible.toLocaleString()} of {lines.length.toLocaleString()} lines
                </span>
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + CHUNK)}
                  className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
                >
                  Load more
                </button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
