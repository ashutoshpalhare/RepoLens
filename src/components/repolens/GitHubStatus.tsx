import { useEffect, useState, useSyncExternalStore } from "react";
import { Gauge, KeyRound } from "lucide-react";
import {
  getRateLimitSnapshot,
  hasStoredGitHubToken,
  subscribeRateLimit,
} from "@/lib/github";
import { cn } from "@/utils/cn";

export function formatResetCountdown(resetAt: number | null, now = Date.now()): string | null {
  if (!resetAt) return null;
  const seconds = Math.max(0, Math.ceil((resetAt - now) / 1000));
  if (seconds <= 0) return "now";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export function ResetCountdown({ resetAt }: { resetAt: number | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!resetAt || resetAt <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [resetAt]);
  const countdown = formatResetCountdown(resetAt, now);
  return countdown ? <span>{countdown}</span> : null;
}

/** Live API budget from GitHub response headers. Hidden until headers exist. */
export function GitHubBudget({
  onOpenSettings,
  compact = false,
  className,
}: {
  onOpenSettings: () => void;
  compact?: boolean;
  className?: string;
}) {
  const rate = useSyncExternalStore(
    subscribeRateLimit,
    getRateLimitSnapshot,
    getRateLimitSnapshot,
  );
  const token = hasStoredGitHubToken();

  if (rate.remaining === null && !token) return null;

  const low = rate.remaining !== null && rate.remaining <= Math.max(5, (rate.limit ?? 60) * 0.1);
  const reset = formatResetCountdown(rate.resetAt);
  const label = rate.remaining === null
    ? "GitHub token active"
    : `${rate.remaining.toLocaleString()} of ${(rate.limit ?? 0).toLocaleString()} GitHub requests left${reset ? `; resets in ${reset}` : ""}`;

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      aria-label={`${label}. Open GitHub API settings.`}
      title={label}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2 text-[11px] transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        low
          ? "border-accent-border bg-accent-soft text-accent"
          : "border-line text-muted hover:border-accent hover:text-accent",
        className,
      )}
    >
      {token ? <KeyRound className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
      {!compact ? (
        <span className="font-mono">
          {rate.remaining === null ? "token" : `${rate.remaining}/${rate.limit ?? "?"}`}
        </span>
      ) : null}
    </button>
  );
}