import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, ExternalLink, Search, X } from "lucide-react";
import type { TreeNode } from "@/lib/analysis";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/primitives";
import { CopyTreeMenu } from "./CopyTreeMenu";
import { FileTypeIcon } from "./FileIcon";
import { EmptyState, ErrorState } from "./StateBlocks";

export type FileExplorerProps = {
  nodes: TreeNode[];
  rootName: string;
  loading?: boolean;
  error?: string | null;
  errorAction?: React.ReactNode;
  onRetry?: () => void;
  selectedPath: string | null;
  onSelect: (node: TreeNode) => void;
  filterRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
};

export function FileExplorer({
  nodes,
  rootName,
  loading,
  error,
  errorAction,
  onRetry,
  selectedPath,
  onSelect,
  filterRef,
  className,
}: FileExplorerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-open the first level whenever a different repository tree arrives.
  useEffect(() => {
    setExpanded(new Set(nodes.filter((n) => n.type === "tree").map((n) => n.path)));
  }, [nodes]);

  const allNodes = useMemo(() => {
    const out: TreeNode[] = [];
    const walk = (list: TreeNode[]) => {
      for (const node of list) {
        if (node.type === "tree") walk(node.children);
        else out.push(node);
      }
    };
    walk(nodes);
    return out;
  }, [nodes]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allNodes.filter((node) => node.path.toLowerCase().includes(q)).slice(0, 500);
  }, [query, allNodes]);

  const rows = useMemo(() => {
    if (matches) return matches.map((node) => ({ node, depth: 0 }));
    const visible: { node: TreeNode; depth: number }[] = [];
    const walk = (list: TreeNode[], depth: number) => {
      for (const node of list) {
        visible.push({ node, depth });
        if (node.type === "tree" && expanded.has(node.path)) {
          walk(node.children, depth + 1);
        }
      }
    };
    walk(nodes, 0);
    return visible;
  }, [expanded, matches, nodes]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 31,
    overscan: 14,
  });

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const expandAll = () => {
    const next = new Set<string>();
    const walk = (list: TreeNode[]) => {
      for (const node of list) {
        if (node.type === "tree") {
          next.add(node.path);
          walk(node.children);
        }
      }
    };
    walk(nodes);
    setExpanded(next);
  };

  const collapseAll = () => setExpanded(new Set());

  const allExpanded =
    nodes.length > 0 &&
    allNodes.some((node) => node.path.includes("/")) &&
    nodes.every((n) => n.type !== "tree" || expanded.has(n.path));

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-surface", className)}>
      <div className="shrink-0 border-b border-line/80 bg-surface px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-faint" aria-hidden="true" />
            <input
              ref={filterRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter files… (⌘⇧F)"
              aria-label="Filter files"
              spellCheck={false}
              className={cn(
                "h-8 w-full rounded-md border border-line/90 bg-surface-2/80 pl-8 pr-7 text-xs font-mono text-ink placeholder:font-sans placeholder:text-faint",
                "transition-all duration-150 hover:border-line-strong focus:border-accent/80 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent/30",
              )}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-1.5 flex h-5 w-5 items-center justify-center rounded text-faint hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={allExpanded ? collapseAll : expandAll}
              title={allExpanded ? "Collapse all folders" : "Expand all folders"}
              aria-label={allExpanded ? "Collapse all folders" : "Expand all folders"}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line/80 bg-surface-2/60 text-muted transition-colors duration-150 hover:border-line-strong hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {allExpanded ? (
                <ChevronsDownUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronsUpDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="rl-scroll min-h-0 flex-1 overflow-auto px-1.5 py-1.5">
        {loading ? (
          <div className="space-y-1.5 p-1" aria-busy="true" aria-label="Loading repository tree">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="ml-3 h-6 w-1/2" />
            <Skeleton className="ml-3 h-6 w-3/5" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        ) : error ? (
          <ErrorState title="Could not load the tree" detail={error} onRetry={onRetry} action={errorAction} />
        ) : nodes.length === 0 ? (
          <EmptyState title="No files" detail="This repository looks empty." />
        ) : matches?.length === 0 ? (
          <EmptyState
            title="No matches"
            detail={`Nothing in this repo matches “${query}”.`}
          />
        ) : (
          <div
            role="tree"
            aria-label="Repository files"
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]!;
              const folder = row.node.type === "tree";
              return (
                <div
                  key={row.node.path}
                  role="treeitem"
                  aria-expanded={folder ? expanded.has(row.node.path) : undefined}
                  aria-selected={!folder ? selectedPath === row.node.path : undefined}
                  className="absolute left-0 top-0 w-full py-px"
                  style={{ transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size }}
                >
                  {folder ? (
                    <FolderRow
                      node={row.node}
                      depth={row.depth}
                      open={expanded.has(row.node.path)}
                      onToggle={() => toggle(row.node.path)}
                    />
                  ) : (
                    <FileRow
                      node={row.node}
                      depth={row.depth}
                      selected={selectedPath === row.node.path}
                      onSelect={onSelect}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-2.5 py-1.5">
        <span className="font-mono text-[10px] text-faint">
          {allNodes.length.toLocaleString()} entries
        </span>
        <CopyTreeMenu nodes={nodes} rootName={rootName} compact />
      </div>
    </div>
  );
}

function FolderRow({
  node,
  depth,
  open,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      style={{ paddingLeft: 6 + depth * 14 }}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left transition-colors duration-150",
        "hover:bg-surface-2/90 focus-visible:bg-surface-2 focus-visible:outline-none",
      )}
    >
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-faint/80 transition-transform duration-150",
          open && "rotate-90 text-muted",
        )}
        aria-hidden="true"
      />
      <FileTypeIcon path={node.path} isFolder open={open} />
      <span className="truncate text-xs font-medium text-ink group-hover:text-ink">{node.name}</span>
      <span className="ml-auto shrink-0 font-mono text-[10px] text-faint/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {node.children.length}
      </span>
    </button>
  );
}

function FileRow({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: boolean;
  onSelect: (node: TreeNode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      title={node.type === "blob" ? node.path : `Open ${node.type} on GitHub: ${node.path}`}
      aria-current={selected ? "true" : undefined}
      style={{ paddingLeft: 6 + depth * 14 }}
      className={cn(
        "group relative flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left transition-colors duration-150",
        "hover:bg-surface-2/70 focus-visible:bg-surface-2 focus-visible:outline-none",
        selected
          ? "bg-accent-soft text-accent font-medium shadow-[inset_0_0_0_1px_var(--rl-accent-border)]"
          : "text-muted hover:text-ink",
      )}
    >
      {selected ? (
        <motion.span
          layoutId="explorer-active-file"
          className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-full bg-accent shadow-[0_0_6px_var(--rl-accent)]"
          transition={{ duration: 0.2, ease: EASE_OUT }}
        />
      ) : null}
      <FileTypeIcon path={node.path} />
      <span className={cn("truncate text-xs font-mono", selected ? "text-accent font-medium" : "text-muted group-hover:text-ink")}>
        {node.name}
      </span>
      {node.type !== "blob" ? (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded border border-line-strong/80 bg-surface px-1 py-0.5 font-mono text-[9px] uppercase tracking-wide text-faint">
          {node.type}
          <ExternalLink className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </button>
  );
}
