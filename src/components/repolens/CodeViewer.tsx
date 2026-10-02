import { Check, Copy, ExternalLink, FileWarning, Image as ImageIcon, Link2 } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useMemo, useState } from "react";
import { FileTypeIcon } from "@/components/repolens/FileTypeIcon";
import { EmptyBlock, ErrorBlock, SkeletonLines } from "@/components/repolens/StateBlocks";
import { formatBytes } from "@/lib/analysis";
import { MAX_FILE_BYTES, extOf, isBinaryPath } from "@/lib/github";
import { useFileContent } from "@/hooks/useRepoData";
import type { RepoRef } from "@/types/repo";

const LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  css: "css",
  scss: "scss",
  html: "markup",
  svg: "markup",
  xml: "markup",
  yml: "yaml",
  yaml: "yaml",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  sh: "bash",
  sql: "sql",
  toml: "toml",
  c: "c",
  cpp: "cpp",
  php: "php",
};

interface Props {
  ref_: RepoRef;
  branch: string | undefined;
  path: string | null;
  size?: number;
  blobUrlBase?: string;
  specialMode?: "symlink" | "submodule" | null;
}

export function CodeViewer({
  ref_,
  branch,
  path,
  size,
  blobUrlBase,
  specialMode = null,
}: Props) {
  const binary = !!path && isBinaryPath(path);
  const tooLarge = (size ?? 0) > MAX_FILE_BYTES;
  const shouldFetch = !!path && !binary && !tooLarge && !specialMode;
  const query = useFileContent(ref_, branch, shouldFetch ? path : null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const language = useMemo(() => (path ? (LANG[extOf(path)] ?? "text") : "text"), [path]);
  const githubUrl = path && blobUrlBase ? `${blobUrlBase}/${path.split("/").map(encodeURIComponent).join("/")}` : null;

  const copy = async () => {
    if (!query.data) return;
    try {
      await navigator.clipboard.writeText(query.data);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-background" aria-label="Code viewer">
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
        {path ? (
          <>
            <FileTypeIcon path={path} />
            <span className="truncate font-mono text-xs text-foreground">{path}</span>
            {!!size && !specialMode && (
              <span className="shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {formatBytes(size)}
              </span>
            )}
            {specialMode && (
              <span className="shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {specialMode}
              </span>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-3">
              {!!query.data && (
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
                >
                  {copied ? (
                    <>
                      Copied <Check aria-hidden className="size-3" />
                    </>
                  ) : (
                    <>
                      Copy <Copy aria-hidden className="size-3" />
                    </>
                  )}
                </button>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
                >
                  GitHub <ExternalLink aria-hidden className="size-3" />
                </a>
              )}
            </div>
          </>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            No file selected
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {!path ? (
          <EmptyBlock
            title="Select a file to read it"
            hint="Pick any file from the explorer. Source files render with syntax highlighting and line numbers."
          />
        ) : specialMode === "symlink" ? (
          <EmptyBlock
            icon={Link2}
            title="Symbolic link"
            hint="This entry is a git symlink. Open it on GitHub to see the target path."
          />
        ) : specialMode === "submodule" ? (
          <EmptyBlock
            icon={Link2}
            title="Git submodule"
            hint="This entry points to another repository. Open it on GitHub to browse the submodule."
          />
        ) : binary ? (
          <EmptyBlock
            icon={ImageIcon}
            title="Binary file"
            hint="RepoLens does not render binary content. Open it on GitHub to view or download it."
          />
        ) : tooLarge ? (
          <EmptyBlock
            icon={FileWarning}
            title={`File too large to render (${formatBytes(size ?? 0)})`}
            hint={`Files above ${formatBytes(MAX_FILE_BYTES)} are skipped to keep the viewer responsive. Open on GitHub instead.`}
          />
        ) : query.isPending ? (
          <SkeletonLines rows={12} />
        ) : query.isError ? (
          <ErrorBlock error={query.error} onRetry={() => query.refetch()} />
        ) : !query.data?.trim() ? (
          <EmptyBlock title="Empty file" hint="This file has no content." />
        ) : (
          <Highlight theme={themes.vsDark} code={query.data.replace(/\n$/, "")} language={language}>
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre className="animate-fade-up min-w-full bg-transparent py-3 font-mono text-[12.5px] leading-[1.65]">
                <code>
                  {tokens.map((line, i) => {
                    const lineProps = getLineProps({ line });
                    return (
                      <div
                        key={i}
                        {...lineProps}
                        className="group flex hover:bg-surface/60"
                        style={{ ...lineProps.style, background: "transparent" }}
                      >
                        <span
                          aria-hidden
                          className="sticky left-0 w-14 shrink-0 select-none bg-background pr-4 text-right text-muted-foreground/60 group-hover:text-muted-foreground"
                        >
                          {i + 1}
                        </span>
                        <span className="whitespace-pre pr-6">
                          {line.map((token, key) => {
                            const props = getTokenProps({ token });
                            return <span key={key} {...props} />;
                          })}
                        </span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </section>
  );
}