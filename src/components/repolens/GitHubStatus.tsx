import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import {
  getRateLimitSnapshot,
  hasStoredGitHubToken,
  subscribeRateLimit,
} from "@/lib/github";
import { cn } from "@/lib/utils";

export function GitHubStatus({
  onOpenSettings,
  className,
}: {
  onOpenSettings?: () => void;
  className?: string;
}) {
  const [snap, setSnap] = useState(getRateLimitSnapshot);
  const [hasToken, setHasToken] = useState(() => hasStoredGitHubToken());

  useEffect(() => {
    return subscribeRateLimit(() => setSnap(getRateLimitSnapshot()));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setHasToken(hasStoredGitHubToken()), 2000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = snap.remaining;
  const limit = snap.limit;
  const low = remaining !== null && remaining <= 5;

  let label = "API";
  if (remaining !== null && limit !== null) {
    label = `${remaining}/${limit}`;
  } else if (remaining !== null) {
    label = `${remaining} left`;
  }

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      title={hasToken ? "Token saved — open settings" : "Add a GitHub token for higher limits"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
        low
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
        className,
      )}
    >
      {hasToken ? <KeyRound className="size-3 text-primary" aria-hidden /> : null}
      <span>{label}</span>
    </button>
  );
}
