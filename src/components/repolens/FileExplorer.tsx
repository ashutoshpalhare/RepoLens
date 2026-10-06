import { ChevronRight, Copy, Folder, FolderOpen, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileTypeIcon } from "@/components/repolens/FileTypeIcon";
import { EmptyBlock } from "@/components/repolens/StateBlocks";
import { copyText, formatBytes, formatTreeAscii } from "@/lib/analysis";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/types/repo";

interface Props {
  tree: FileNode[];
  activePath: string | null;
  onSelect: (path: string) => void;
  rootName?: string;
}

function flatten(nodes: FileNode[], out: FileNode[] = []) {
  for (const node of nodes) {
    if (node.type === "file") out.push(node);
    else if (node.children) flatten(node.children, out);
  }
  return out;
}

function collectDirPaths(nodes: FileNode[], out: string[] = []) {
  for (const node of nodes) {
    if (node.type === "dir") {
      out.push(node.path);
      if (node.children) collectDirPaths(node.children, out);
    }
  }
  return out;
}

export function FileExplorer({ tree, activePath, onSelect, rootName }: Props) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(tree.slice(0, 2).map((n) => n.path)));
  const [query, setQuery] = useState("");

  const allFiles = useMemo(() => flatten(tree), [tree]);
  const allDirs = useMemo(() => collectDirPaths(tree), [tree]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allFiles.filter((f) => f.path.toLowerCase().includes(q)).slice(0, 200);
  }, [allFiles, query]);

  const toggle = (path: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const expandAll = () => setOpen(new Set(allDirs));
  const collapseAll = () => setOpen(new Set());

  const onCopyTree = async () => {
    const text = formatTreeAscii(tree, { maxDepth: 99, rootName: rootName ?? "repo" });
    const ok = await copyText(text);
    if (ok) toast.success("Directory tree copied");
    else toast.error("Could not copy to clipboard");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-3 py-2.5">
        <Search aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter files…"
          aria-label="Filter files by name"
          className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear file filter"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-border bg-background/40 px-2 py-1.5">
        <button
          type="button"
          onClick={expandAll}
          className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Expand
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Collapse
        </button>
        <button
          type="button"
          onClick={onCopyTree}
          className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          title="Copy directory tree"
        >
          <Copy className="size-3" />
          Tree
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {results ? (
          results.length === 0 ? (
            <EmptyBlock title="No files match" hint={`Nothing in this repository matches “${query}”.`} />
          ) : (
            <ul role="list" className="px-1.5">
              {results.map((file) => (
                <li key={file.path}>
                  <FileRow
                    node={file}
                    depth={0}
                    active={file.path === activePath}
                    label={file.path}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          )
        ) : (
          <Tree
            nodes={tree}
            depth={0}
            open={open}
            toggle={toggle}
            activePath={activePath}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}

function Tree({
  nodes,
  depth,
  open,
  toggle,
  activePath,
  onSelect,
}: {
  nodes: FileNode[];
  depth: number;
  open: Set<string>;
  toggle: (path: string) => void;
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <ul role={depth === 0 ? "tree" : "group"} className={cn(depth === 0 && "px-1.5")}>
      {nodes.map((node) =>
        node.type === "dir" ? (
          <li key={node.path} role="treeitem" aria-expanded={open.has(node.path)}>
            <button
              type="button"
              onClick={() => toggle(node.path)}
              className="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/70"
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              <ChevronRight
                aria-hidden
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                  open.has(node.path) && "rotate-90",
                )}
              />
              {open.has(node.path) ? (
                <FolderOpen aria-hidden className="size-4 shrink-0 text-primary" />
              ) : (
                <Folder aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate font-mono text-xs text-foreground/90">{node.name}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {node.children?.length ?? 0}
              </span>
            </button>
            {open.has(node.path) && node.children && (
              <Tree
                nodes={node.children}
                depth={depth + 1}
                open={open}
                toggle={toggle}
                activePath={activePath}
                onSelect={onSelect}
              />
            )}
          </li>
        ) : (
          <li key={node.path} role="treeitem">
            <FileRow
              node={node}
              depth={depth}
              active={node.path === activePath}
              label={node.name}
              onSelect={onSelect}
            />
          </li>
        ),
      )}
    </ul>
  );
}

function FileRow({
  node,
  depth,
  active,
  label,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  active: boolean;
  label: string;
  onSelect: (path: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      aria-current={active ? "true" : undefined}
      title={node.path}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left transition-colors",
        active ? "bg-primary/12 text-foreground ring-1 ring-inset ring-primary/20" : "hover:bg-accent/70",
      )}
      style={{ paddingLeft: 22 + depth * 12 }}
    >
      <FileTypeIcon path={node.path} />
      <span
        className={cn(
          "truncate font-mono text-xs",
          active ? "text-primary" : "text-foreground/80",
        )}
      >
        {label}
      </span>
      {!!node.size && (
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {formatBytes(node.size)}
        </span>
      )}
    </button>
  );
}