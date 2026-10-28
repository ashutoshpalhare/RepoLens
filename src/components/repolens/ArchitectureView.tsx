import { motion } from "framer-motion";
import { Compass, Info, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { formatBytes, type ArchitectureReport } from "@/lib/analysis";
import { SectionHeading } from "@/components/ui/primitives";
import { EASE_OUT, stagger } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { EmptyState } from "./StateBlocks";

import { useState } from "react";
import {
  Boxes,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  FileText,
  Filter,
  Layers,
  Palette,
  Server,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { copyText } from "@/lib/hooks";

const TONE_ICON = {
  ok: <ShieldCheck className="h-4 w-4 text-ok" />,
  warn: <TriangleAlert className="h-4 w-4 text-accent" />,
  info: <Info className="h-4 w-4 text-info" />,
} as const;

const LAYER_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string; category: string }
> = {
  client: {
    icon: <Layers className="h-4 w-4" />,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    category: "Entrypoint",
  },
  ui: {
    icon: <Boxes className="h-4 w-4" />,
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.35)",
    category: "Presentation",
  },
  state: {
    icon: <Database className="h-4 w-4" />,
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.35)",
    category: "Data & State",
  },
  core: {
    icon: <Cpu className="h-4 w-4" />,
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.35)",
    category: "Domain Logic",
  },
  style: {
    icon: <Palette className="h-4 w-4" />,
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.12)",
    border: "rgba(244, 114, 182, 0.35)",
    category: "Design & Assets",
  },
  tests: {
    icon: <TestTube2 className="h-4 w-4" />,
    color: "#a3e635",
    bg: "rgba(163, 230, 53, 0.12)",
    border: "rgba(163, 230, 53, 0.35)",
    category: "Quality Assurance",
  },
  infra: {
    icon: <Server className="h-4 w-4" />,
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.35)",
    category: "DevOps & Config",
  },
  docs: {
    icon: <FileText className="h-4 w-4" />,
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.35)",
    category: "Documentation",
  },
};

export function ArchitectureView({
  report,
  loading,
  progress,
  onCancel,
  cancelled,
  onRestart,
  className,
}: {
  report: ArchitectureReport | null;
  loading?: boolean;
  progress?: number;
  onCancel?: () => void;
  cancelled?: boolean;
  onRestart?: () => void;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn("rl-scroll overflow-auto p-6", className)}>
        <div className="mx-auto flex min-h-[220px] max-w-sm flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-ink">Analysing structure…</p>
          <p className="mt-1 text-xs text-muted">Mapping files onto architectural layers in small, non-blocking batches.</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${progress ?? 0}%` }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
            />
          </div>
          <p className="mt-2 font-mono text-xs text-accent">{progress ?? 0}%</p>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <X className="h-3.5 w-3.5" /> Cancel scan
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className={cn("flex items-center justify-center p-6", className)}>
        <EmptyState
          title="Architecture scan cancelled"
          detail="No analysis was retained. Restart when you are ready."
          action={onRestart ? (
            <button
              type="button"
              onClick={onRestart}
              className="mt-1 min-h-9 rounded-lg border border-line-strong px-3 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Restart scan
            </button>
          ) : undefined}
        />
      </div>
    );
  }

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!report || report.layers.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-6", className)}>
        <EmptyState
          title="No architecture to show"
          detail="RepoLens could not find enough files in this repository to infer a structure."
        />
      </div>
    );
  }

  const copyArchitectureReport = () => {
    const text = [
      `# Repository Architecture Overview`,
      ``,
      report.summary,
      ``,
      `## Layers`,
      ...report.layers.map(
        (l) =>
          `- **${l.label}** (${(l.share * 100).toFixed(1)}% | ${l.files} files | ${formatBytes(l.bytes)}): ${l.description}`
      ),
      ``,
      `## Signals`,
      ...report.signals.map((s) => `- [${s.tone.toUpperCase()}] ${s.label}: ${s.detail}`),
    ].join("\n");
    void copyText(text, "Architecture report copied");
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const displayedLayers = selectedLayerId
    ? report.layers.filter((l) => l.id === selectedLayerId)
    : report.layers;

  return (
    <div className={cn("rl-scroll min-h-0 overflow-auto p-4 sm:p-6", className)}>
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="mx-auto max-w-5xl space-y-7">
        {/* Architecture Dashboard Header */}
        <section className="relative overflow-hidden rounded-2xl border border-line-strong/80 bg-surface/90 p-5 shadow-sm rl-hairline-top sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <SectionHeading
              icon={<Compass className="h-4 w-4" />}
              title="Architecture Blueprint"
              subtitle="Automated codebase stratification derived from file conventions, roles, and directories — computed purely in-browser."
            />
            <button
              type="button"
              onClick={copyArchitectureReport}
              className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface-2/80 px-2.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              title="Copy markdown architecture summary"
            >
              {copiedSummary ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSummary ? "Copied" : "Copy summary"}</span>
            </button>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-muted max-w-3xl border-l-2 border-accent/60 pl-3.5">
            {report.summary}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Cell label="Files Mapped" value={report.totalFiles.toLocaleString()} hint={`${Math.round(((report.totalFiles - report.unclassified) / (report.totalFiles || 1)) * 100)}% coverage`} />
            <Cell label="Distinct Layers" value={String(report.layers.length)} hint="classified layers" />
            <Cell label="Unclassified" value={report.unclassified.toLocaleString()} hint="general files" />
            <Cell label="Total Size" value={formatBytes(report.totalBytes)} hint="uncompressed" />
          </dl>
        </section>

        {/* Multi-layer Spectrum Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-ink">Layer Distribution</h3>
            </div>
            {selectedLayerId ? (
              <button
                type="button"
                onClick={() => setSelectedLayerId(null)}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
              >
                <Filter className="h-3 w-3" /> Show all layers
              </button>
            ) : null}
          </div>

          {/* Spectrum Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2 border border-line/60">
            {report.layers.map((layer) => {
              const cfg = LAYER_CONFIG[layer.id] ?? { color: "var(--rl-accent)" };
              const width = Math.max(1, layer.share * 100);
              const isSelected = selectedLayerId === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setSelectedLayerId(selectedLayerId === layer.id ? null : layer.id)}
                  style={{ width: `${width}%`, backgroundColor: cfg.color }}
                  className={cn(
                    "h-full transition-opacity hover:opacity-100",
                    selectedLayerId && !isSelected ? "opacity-30" : "opacity-90"
                  )}
                  title={`${layer.label}: ${(layer.share * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {report.layers.map((layer) => {
              const cfg = LAYER_CONFIG[layer.id] ?? { color: "var(--rl-accent)", bg: "var(--rl-accent-soft)" };
              const isSelected = selectedLayerId === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setSelectedLayerId(isSelected ? null : layer.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-mono transition-all",
                    isSelected
                      ? "border-accent bg-accent-soft text-accent ring-1 ring-accent"
                      : "border-line/80 bg-surface/80 text-muted hover:border-line-strong hover:text-ink"
                  )}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span>{layer.label}</span>
                  <span className="font-sans text-[10px] text-faint">{(layer.share * 100).toFixed(0)}%</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Detailed Layer Cards Grid */}
        <section className="space-y-3">
          <SectionHeading
            title="Layer Blueprint Cards"
            subtitle="Deep dive into each classified architectural tier"
          />

          <div className="grid gap-3.5 sm:grid-cols-2">
            {displayedLayers.map((layer, index) => {
              const cfg = LAYER_CONFIG[layer.id] ?? {
                icon: <Boxes className="h-4 w-4" />,
                color: "var(--rl-accent)",
                bg: "var(--rl-accent-soft)",
                border: "var(--rl-accent-border)",
                category: "Module",
              };
              const isSelected = selectedLayerId === layer.id;

              return (
                <motion.article
                  key={layer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.24, ease: EASE_OUT }}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 rl-hairline-top",
                    isSelected
                      ? "border-accent bg-surface ring-1 ring-accent/30 shadow-md"
                      : "border-line/80 bg-surface/80 hover:border-line-strong hover:bg-surface hover:shadow-sm"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: cfg.bg,
                            borderColor: cfg.border,
                            color: cfg.color,
                          }}
                        >
                          {cfg.icon}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
                            {layer.label}
                          </h4>
                          <span className="font-mono text-[10px] text-faint uppercase tracking-wider">
                            {cfg.category}
                          </span>
                        </div>
                      </div>
                      <span
                        className="font-mono text-sm font-semibold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {(layer.share * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted">{layer.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-faint">
                      <span>{layer.files.toLocaleString()} files</span>
                      <span>{formatBytes(layer.bytes)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(2, layer.share * 100))}%`,
                          backgroundColor: cfg.color,
                        }}
                      />
                    </div>
                    {layer.paths.length ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {layer.paths.slice(0, 4).map((p) => (
                          <span
                            key={p}
                            className="rounded border border-line bg-surface-2/80 px-1.5 py-0.5 font-mono text-[10px] text-faint"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Signals & Repository Health */}
        <section className="space-y-3">
          <SectionHeading
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Architectural Signals & Health Audit"
            subtitle="Automated checks based on software engineering patterns and separation of concerns"
          />

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {report.signals.map((signal, index) => (
              <motion.li
                key={signal.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2, ease: EASE_OUT }}
                className="flex items-start gap-3 rounded-xl border border-line/80 bg-surface/80 p-3.5 transition-colors hover:border-line-strong rl-hairline-top"
              >
                <span className="mt-0.5 shrink-0">{TONE_ICON[signal.tone]}</span>
                <div>
                  <h4 className="text-xs font-semibold text-ink sm:text-sm">{signal.label}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{signal.detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      </motion.div>
    </div>
  );
}

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line/80 bg-surface-2/60 p-3 rl-hairline-top">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold tracking-tight text-ink tabular-nums">{value}</dd>
      {hint ? <p className="mt-0.5 text-[10px] font-mono text-faint">{hint}</p> : null}
    </div>
  );
}
