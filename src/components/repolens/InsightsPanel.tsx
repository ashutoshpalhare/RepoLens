import { GitFork, Scale, Star, CircleDot } from "lucide-react";
import { formatBytes } from "@/lib/analysis";
import { cn } from "@/lib/utils";
import type { RepoInsights, RepoMeta } from "@/types/repo";

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface-2 p-3", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg text-foreground">{value}</p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LanguageBars({
  languages,
  limit = 6,
}: {
  languages: RepoInsights["languages"];
  limit?: number;
}) {
  const top = languages.slice(0, limit);
  const max = Math.max(1, ...top.map((l) => l.files));
  return (
    <ul className="space-y-2">
      {top.map((lang) => (
        <li key={lang.ext || "none"}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-mono text-xs text-foreground/90">{lang.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {lang.files} · {formatBytes(lang.bytes)}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary/80 transition-all duration-500"
              style={{ width: `${(lang.files / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InsightsPanel({
  meta,
  insights,
  onSelectFile,
}: {
  meta: RepoMeta;
  insights: RepoInsights;
  onSelectFile: (path: string) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-y-auto" aria-label="Repository insights">
      <Section title="Repository">
        <p className="text-sm leading-relaxed text-foreground/90">
          {meta.description || "No description provided."}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Star aria-hidden className="size-3.5 text-primary" />
            {meta.stargazers_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork aria-hidden className="size-3.5" />
            {meta.forks_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <CircleDot aria-hidden className="size-3.5" />
            {meta.open_issues_count.toLocaleString()} open
          </span>
          {meta.license?.spdx_id && (
            <span className="flex items-center gap-1.5">
              <Scale aria-hidden className="size-3.5" />
              {meta.license.spdx_id}
            </span>
          )}
        </div>
      </Section>

      <Section title="Composition">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Files" value={insights.totalFiles.toLocaleString()} />
          <Stat label="Folders" value={insights.totalFolders.toLocaleString()} />
          <Stat label="Tracked size" value={formatBytes(insights.totalBytes)} />
          <Stat label="Repo size" value={formatBytes(meta.size * 1024)} hint="reported by GitHub" />
        </div>
      </Section>

      <Section title="File types">
        <LanguageBars languages={insights.languages} />
      </Section>

      <Section title="Largest files">
        <ul className="space-y-1">
          {insights.largestFiles.map((file) => (
            <li key={file.path}>
              <button
                onClick={() => onSelectFile(file.path)}
                className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent/70"
              >
                <span className="truncate font-mono text-xs text-foreground/85">{file.path}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Structure">
        <ul className="space-y-1">
          {insights.topLevel.map((entry) => (
            <li
              key={entry.path}
              className="flex items-baseline justify-between gap-3 px-2 font-mono text-xs"
            >
              <span className="truncate text-foreground/85">{entry.path}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {entry.files} files
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </aside>
  );
}
