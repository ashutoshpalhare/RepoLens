import { AlertTriangle, Clock, FolderOpen, Loader2, SearchX, WifiOff } from "lucide-react";
import { GitHubError } from "@/types/repo";
import { cn } from "@/lib/utils";

export function LoadingBlock({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-full min-h-40 flex-col items-center justify-center gap-3 text-center",
        className,
      )}
    >
      <Loader2 aria-hidden className="size-5 animate-spin text-primary" />
      <p className="font-mono text-xs tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export function SkeletonLines({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded bg-surface-2" style={{ height: 12, width: `${95 - i * 7}%` }}>
          <div className="animate-sweep absolute inset-0 bg-gradient-to-r from-transparent via-border-strong to-transparent" />
        </div>
      ))}
    </div>
  );
}

export function EmptyBlock({
  title,
  hint,
  icon: Icon = FolderOpen,
}: {
  title: string;
  hint?: string;
  icon?: typeof FolderOpen;
}) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid size-11 place-items-center rounded-lg border border-border bg-surface-2">
        <Icon aria-hidden className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {hint && <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function iconFor(kind: string) {
  if (kind === "rate_limit") return Clock;
  if (kind === "network") return WifiOff;
  if (kind === "not_found") return SearchX;
  return AlertTriangle;
}

export function ErrorBlock({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const kind = error instanceof GitHubError ? error.kind : "unknown";
  const message =
    error instanceof Error ? error.message : "Something went wrong loading this repository.";
  const Icon = iconFor(kind);

  return (
    <div
      role="alert"
      className={cn(
        "flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 text-center",
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-lg border border-destructive/40 bg-destructive/10">
        <Icon aria-hidden className="size-5 text-destructive" />
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-destructive">
          {kind.replace("_", " ")}
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-foreground">{message}</p>
        {kind === "rate_limit" && (
          <p className="mt-2 max-w-sm text-xs text-muted-foreground">
            Unauthenticated GitHub API requests are limited to 60 per hour per IP address.
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md border border-border-strong bg-surface-2 px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:bg-accent"
        >
          Try again
        </button>
      )}
    </div>
  );
}
