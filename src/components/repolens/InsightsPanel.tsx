import { motion } from "framer-motion";
import {
  Boxes,
  FileStack,
  Files,
  FlaskConical,
  FolderTree,
  Gauge,
  GitBranch,
  HardDrive,
  Layers,
  Star,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  formatBytes,
  formatCount,
  formatRelative,
  formatTreeAscii,
  type RepoInsights,
  type TreeNode,
} from "@/lib/analysis";
import type { RepoMeta } from "@/lib/github";
import { cn } from "@/utils/cn";
import { Bar, Badge, SectionHeading, StatTile } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/primitives";
import { EASE_OUT, stagger } from "@/lib/motion";
import { CopyTreeMenu } from "./CopyTreeMenu";
import { ErrorState } from "./StateBlocks";

export type InsightsPanelProps = {
  meta: RepoMeta | null;
  insights: RepoInsights;
  nodes: TreeNode[];
  rootName: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectFile?: (path: string) => void;
  className?: string;
};

export function InsightsPanel({
  meta,
  insights,
  nodes,
  rootName,
  loading,
  error,
  onRetry,
  onSelectFile,
  className,
}: InsightsPanelProps) {
  if (error) {
    return (
      <div className={cn("rl-scroll overflow-auto p-4", className)}>
        <ErrorState title="Insights unavailable" detail={error} onRetry={onRetry} />
      </div>
    );
  }

  const treePreview = nodes.length
    ? formatTreeAscii(nodes, { maxDepth: 2, rootName }).split("\n").slice(0, 40)
    : [];

  return (
    <div className={cn("rl-scroll min-h-0 overflow-auto bg-surface p-3", className)}>
      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {/* ------------------------------------------------------- quick stats */}
        <section aria-labelledby="insights-stats">
          <SectionHeading
            icon={<Gauge className="h-4 w-4" />}
            title="At a glance"
            subtitle={meta ? `Updated ${formatRelative(meta.pushedAt)}` : undefined}
          />
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {loading ? (
              <>
                <Skeleton className="h-[68px]" />
                <Skeleton className="h-[68px]" />
                <Skeleton className="h-[68px]" />
                <Skeleton className="h-[68px]" />
              </>
            ) : (
              <>
                <StatTile
                  icon={<Files className="h-3.5 w-3.5" />}
                  label="Files"
                  value={insights.fileCount.toLocaleString()}
                  hint={`${insights.dirCount} folders`}
                />
                <StatTile
                  icon={<HardDrive className="h-3.5 w-3.5" />}
                  label="Repo size"
                  value={formatBytes(insights.totalBytes)}
                  hint={`avg ${formatBytes(insights.avgFileBytes)}/file`}
                />
                <StatTile
                  icon={<GitBranch className="h-3.5 w-3.5" />}
                  label="Max depth"
                  value={insights.maxDepth}
                  hint="nested levels"
                />
                <StatTile
                  icon={<FlaskConical className="h-3.5 w-3.5" />}
                  label="Tests"
                  value={insights.testFiles.toLocaleString()}
                  hint={`${insights.configFiles} config files`}
                />
              </>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------- repository health */}
        <section aria-labelledby="insights-health" className="rounded-xl border border-line bg-surface-2/60 p-3">
          <div className="flex items-start justify-between gap-3">
            <SectionHeading
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Repository health"
              subtitle="Heuristic signals · not a code-quality audit"
            />
            <div className="shrink-0 text-right">
              <div className="font-mono text-2xl font-semibold text-ink">{insights.health.score}<span className="text-xs text-faint">/100</span></div>
              <Badge tone={insights.health.score >= 80 ? "ok" : insights.health.score >= 60 ? "accent" : "warn"}>{insights.health.grade}</Badge>
            </div>
          </div>
          {insights.health.partial ? (
            <p role="status" className="mt-2 rounded-lg border border-accent-border bg-accent-soft px-2.5 py-2 text-[11px] leading-relaxed text-accent">
              Partial tree: score uses only the files GitHub returned and may change when missing folders are inspected.
            </p>
          ) : null}
          <div className="mt-3 space-y-2">
            {insights.health.dimensions.map((dimension) => (
              <div key={dimension.id}>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-ink">{dimension.label}</span>
                  <span className="font-mono text-faint">{dimension.score}/20</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(dimension.score / 20) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-[10px] text-faint">{dimension.detail}</p>
              </div>
            ))}
          </div>
          {insights.health.recommendations.length ? (
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Suggested next steps
              </div>
              <ul className="space-y-2">
                {insights.health.recommendations.slice(0, 4).map((recommendation) => (
                  <li key={recommendation.title} className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Badge tone={recommendation.priority === "high" ? "warn" : "neutral"}>{recommendation.priority}</Badge>
                      <span className="font-medium text-ink">{recommendation.title}</span>
                    </div>
                    <p className="mt-0.5 pl-1 text-faint">{recommendation.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-faint">No obvious structural gaps were detected in the indexed files.</p>
          )}
        </section>

        {/* ------------------------------------------------------ detected stack */}
        {insights.stack.length || insights.ecosystems.length ? (
          <section aria-labelledby="insights-stack">
            <SectionHeading icon={<Layers className="h-4 w-4" />} title="Stack & ecosystem" subtitle="Detected from tracked filenames and config paths" />
            {insights.stack.length ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {insights.stack.map((item) => (
                  <li key={item.name} title={`${item.category}: ${item.evidence.join(", ")}`}>
                    <Badge tone="accent">{item.name}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-xs text-faint">No known framework or tooling markers found.</p>}
            {insights.ecosystems.length ? (
              <ul className="mt-3 space-y-2">
                {insights.ecosystems.map((ecosystem) => (
                  <li key={ecosystem.name} className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[11px]">
                    <div className="font-medium text-ink">{ecosystem.name}</div>
                    <p className="mt-0.5 break-words font-mono text-faint">{ecosystem.manifests.length ? ecosystem.manifests.join(", ") : "Lockfile only"}{ecosystem.lockfiles.length ? ` · ${ecosystem.lockfiles.join(", ")}` : ""}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {/* --------------------------------------------------------- languages */}
        {insights.languages.length ? (
          <section aria-labelledby="insights-langs">
            <SectionHeading
              icon={<FileStack className="h-4 w-4" />}
              title="Languages"
              subtitle="By bytes of tracked source"
            />
            {/* Multi-color Spectrum Bar */}
            <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-surface-2 border border-line/50">
              {insights.languages.map((lang) => (
                <div
                  key={lang.name}
                  style={{ width: `${lang.share * 100}%`, backgroundColor: lang.color }}
                  title={`${lang.name} · ${(lang.share * 100).toFixed(1)}%`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {insights.languages.slice(0, 7).map((lang, index) => (
                <motion.li
                  key={lang.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.18, ease: EASE_OUT }}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-ink">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lang.color }} />
                      {lang.name}
                    </span>
                    <span className="font-mono text-faint">
                      {(lang.share * 100).toFixed(1)}% · {lang.files}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Bar value={lang.share} color={lang.color} />
                  </div>
                </motion.li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* -------------------------------------------------------- tree block */}
        {nodes.length ? (
          <section aria-labelledby="insights-tree">
            <SectionHeading
              icon={<FolderTree className="h-4 w-4" />}
              title="Directory tree"
              subtitle="Depth-2 preview"
              action={<CopyTreeMenu nodes={nodes} rootName={rootName} compact />}
            />
            <pre className="rl-scroll mt-2.5 max-h-52 overflow-auto rounded-xl border border-line bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
              {treePreview.join("\n")}
            </pre>
          </section>
        ) : null}

        {/* ---------------------------------------------------------- top dirs */}
        {insights.topDirs.length ? (
          <section aria-labelledby="insights-dirs">
            <SectionHeading
              icon={<Layers className="h-4 w-4" />}
              title="Where the code lives"
              subtitle="Files per top-level entry"
            />
            <ul className="mt-2.5 space-y-1.5">
              {insights.topDirs.map((dir) => (
                <li key={dir.path} className="text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-ink">{dir.path}</span>
                    <span className="font-mono text-faint">{dir.files} · {formatBytes(dir.bytes)}</span>
                  </div>
                  <div className="mt-1">
                    <Bar value={dir.files / (insights.topDirs[0]?.files || 1)} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ------------------------------------------------------ largest files */}
        {insights.largestFiles.length ? (
          <section aria-labelledby="insights-large">
            <SectionHeading
              icon={<Boxes className="h-4 w-4" />}
              title="Largest files"
              subtitle="Candidates for splitting"
            />
            <ul className="mt-2.5 space-y-1">
              {insights.largestFiles.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => onSelectFile?.(file.path)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                  >
                    <span className="truncate font-mono text-[11px] text-ink">{file.path}</span>
                    <span className="shrink-0 font-mono text-[11px] text-faint">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* --------------------------------------------------------- repo meta */}
        {meta ? (
          <section aria-labelledby="insights-meta">
            <SectionHeading icon={<Star className="h-4 w-4" />} title="Repository" />
            <dl className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <Meta label="Stars" value={formatCount(meta.stars)} />
              <Meta label="Forks" value={formatCount(meta.forks)} />
              <Meta label="Open issues" value={formatCount(meta.openIssues)} />
              <Meta label="License" value={meta.license ?? "—"} />
              <Meta label="Default branch" value={meta.ref} />
              <Meta label="Language" value={meta.language ?? "—"} />
            </dl>
            {meta.topics.length ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {meta.topics.slice(0, 8).map((topic) => (
                  <li key={topic}>
                    <Badge tone="accent">#{topic}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </motion.div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
      <dt className="text-[10px] uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-[11px] text-ink">{value}</dd>
    </div>
  );
}
