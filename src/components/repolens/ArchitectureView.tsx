import { ArrowRight, Network } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/repolens/StateBlocks";
import type { ArchProgress } from "@/hooks/useRepoData";
import { cn } from "@/lib/utils";
import type { DependencyGraph } from "@/types/repo";

interface Props {
  graph: DependencyGraph | undefined;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  onOpenFile: (path: string) => void;
  progress?: ArchProgress;
  percent?: number;
  onCancel?: () => void;
}

const NODE_H = 26;
const GAP = 10;
const COL_W = 260;

export function ArchitectureView({
  graph,
  isPending,
  error,
  onRetry,
  onOpenFile,
  progress,
  percent = 0,
  onCancel,
}: Props) {
  const [focus, setFocus] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!graph) return null;
    const groups = new Map<string, typeof graph.modules>();
    for (const mod of graph.modules) {
      const list = groups.get(mod.group) ?? [];
      list.push(mod);
      groups.set(mod.group, list);
    }
    const cols = [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)
      .map(([group, mods], colIndex) => ({
        group,
        colIndex,
        mods: mods.slice(0, 14),
      }));

    const pos = new Map<string, { x: number; y: number; col: number }>();
    for (const col of cols) {
      col.mods.forEach((mod, i) => {
        pos.set(mod.path, {
          x: col.colIndex * COL_W + 16,
          y: 52 + i * (NODE_H + GAP),
          col: col.colIndex,
        });
      });
    }

    const height = 72 + Math.max(...cols.map((c) => c.mods.length), 1) * (NODE_H + GAP);
    const width = cols.length * COL_W + 32;
    const edges = graph.edges.filter((e) => pos.has(e.from) && pos.has(e.to));

    return { cols, pos, height, width, edges };
  }, [graph]);

  if (isPending) {
    const phaseLabel =
      progress?.phase === "analyzing"
        ? "Building dependency graph…"
        : progress?.phase === "fetching"
          ? `Fetching sources ${progress.done}/${progress.total || "…"}`
          : "Scanning source files for import relationships…";

    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-6">
        <LoadingBlock label={phaseLabel} className="min-h-0 flex-none" />
        <div className="w-full max-w-sm space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.max(percent, progress?.phase === "analyzing" ? 95 : 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>
              {progress?.phase === "analyzing" ? "Analyzing…" : `${percent}%`}
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded border border-border px-2 py-0.5 text-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const cancelled =
      error instanceof DOMException && error.name === "AbortError"
        ? true
        : error instanceof Error && /cancel/i.test(error.message);

    if (cancelled) {
      return (
        <EmptyBlock
          icon={Network}
          title="Scan cancelled"
          hint="Architecture analysis was stopped before it finished. Retry when you want a full module map."
        />
      );
    }
    return <ErrorBlock error={error} onRetry={onRetry} />;
  }

  if (!graph || !layout || graph.modules.length === 0) {
    return (
      <EmptyBlock
        icon={Network}
        title="No relative import relationships detected"
        hint="RepoLens scans a sample of source files for relative imports. This repository may use only package imports, or its sources are in an unsupported language."
      />
    );
  }

  const related = new Set<string>();
  if (focus) {
    for (const edge of layout.edges) {
      if (edge.from === focus) related.add(edge.to);
      if (edge.to === focus) related.add(edge.from);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-5 py-3 font-mono text-[11px] text-muted-foreground">
        <span>
          <span className="text-foreground">{graph.modules.length}</span> modules
        </span>
        <span>
          <span className="text-foreground">{graph.edges.length}</span> edges
        </span>
        <span>
          <span className="text-foreground">{graph.scanned}</span> files scanned
        </span>
        {graph.skipped > 0 && <span>{graph.skipped} skipped</span>}
        <span className="ml-auto hidden sm:inline">
          Lightweight relative-import analysis — not a compiler-level graph
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <svg
          role="img"
          aria-label="Module dependency graph"
          width={layout.width}
          height={layout.height}
          className="animate-fade-up max-w-none"
        >
          <defs>
            <marker id="rl-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill="var(--color-border-strong)" />
            </marker>
          </defs>

          {layout.cols.map((col) => (
            <text
              key={col.group}
              x={col.colIndex * COL_W + 16}
              y={28}
              className="fill-muted-foreground font-mono"
              style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {col.group.length > 28 ? `…${col.group.slice(-27)}` : col.group}
            </text>
          ))}

          {layout.edges.map((edge, i) => {
            const a = layout.pos.get(edge.from)!;
            const b = layout.pos.get(edge.to)!;
            const x1 = a.x + COL_W - 40;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const active = focus && (edge.from === focus || edge.to === focus);
            return (
              <path
                key={i}
                d={`M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`}
                fill="none"
                stroke={active ? "var(--color-primary)" : "var(--color-border-strong)"}
                strokeWidth={active ? 1.4 : 0.8}
                opacity={focus ? (active ? 0.95 : 0.12) : 0.55}
                markerEnd="url(#rl-arrow)"
              />
            );
          })}

          {layout.cols.flatMap((col) =>
            col.mods.map((mod) => {
              const p = layout.pos.get(mod.path)!;
              const dim = focus && mod.path !== focus && !related.has(mod.path);
              return (
                <g
                  key={mod.path}
                  transform={`translate(${p.x},${p.y})`}
                  opacity={dim ? 0.25 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setFocus(mod.path)}
                  onMouseLeave={() => setFocus(null)}
                  onClick={() => onOpenFile(mod.path)}
                >
                  <rect
                    width={COL_W - 56}
                    height={NODE_H}
                    rx={6}
                    fill={mod.path === focus ? "var(--color-primary)" : "var(--color-surface-2)"}
                    stroke={
                      mod.path === focus ? "var(--color-primary)" : "var(--color-border-strong)"
                    }
                  />
                  <text
                    x={10}
                    y={17}
                    className="font-mono"
                    style={{ fontSize: 11 }}
                    fill={
                      mod.path === focus
                        ? "var(--color-primary-foreground)"
                        : "var(--color-foreground)"
                    }
                  >
                    {mod.label.length > 26 ? `…${mod.label.slice(-25)}` : mod.label}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
      </div>

      <div className="max-h-56 shrink-0 overflow-y-auto border-t border-border">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0 bg-surface text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-5 py-2 font-normal">Module</th>
              <th className="px-3 py-2 font-normal">Imports</th>
              <th className="px-3 py-2 font-normal">Imported by</th>
            </tr>
          </thead>
          <tbody>
            {graph.modules.slice(0, 40).map((mod) => (
              <tr
                key={mod.path}
                onMouseEnter={() => setFocus(mod.path)}
                onMouseLeave={() => setFocus(null)}
                className={cn(
                  "border-t border-border/60 transition-colors",
                  focus === mod.path ? "bg-primary/10" : "hover:bg-accent/60",
                )}
              >
                <td className="px-5 py-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenFile(mod.path)}
                    className="flex items-center gap-1.5 text-foreground/85 transition-colors hover:text-primary"
                  >
                    <ArrowRight aria-hidden className="size-3 text-muted-foreground" />
                    <span className="truncate">{mod.path}</span>
                  </button>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">{mod.imports}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{mod.importedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}