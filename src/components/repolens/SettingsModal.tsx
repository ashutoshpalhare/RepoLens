import { KeyRound, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getStoredGitHubToken,
  setStoredGitHubToken,
} from "@/lib/github";

export function SettingsModal({
  open,
  onClose,
  onCredentialChange,
}: {
  open: boolean;
  onClose: () => void;
  onCredentialChange?: () => void;
}) {
  const [token, setToken] = useState("");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHasToken(Boolean(getStoredGitHubToken()));
    // Never echo an existing credential back into the input.
    setToken("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = token.trim();
    if (!normalized) return;
    setStoredGitHubToken(normalized);
    setToken("");
    setHasToken(true);
    toast.success("GitHub token saved in this browser only.");
    onCredentialChange?.();
    onClose();
  };

  const clear = () => {
    setStoredGitHubToken(null);
    setToken("");
    setHasToken(false);
    toast.success("Token removed from this browser.");
    onCredentialChange?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="settings-title" className="text-sm font-semibold text-foreground">
            GitHub API settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={save} className="space-y-4 p-4">
          <div className="flex gap-3 rounded-lg border border-border bg-surface-2 p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Optional personal access token. Stored only in this browser&apos;s localStorage and
              sent only to <span className="font-mono text-foreground">api.github.com</span>. Prefer
              a fine-grained, read-only token.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-foreground">
              Personal access token
              {hasToken ? (
                <span className="font-normal text-primary">Token stored</span>
              ) : null}
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={hasToken ? "Enter a new token to replace…" : "ghp_… or github_pat_…"}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!token.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Save token
            </button>
            {hasToken && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
