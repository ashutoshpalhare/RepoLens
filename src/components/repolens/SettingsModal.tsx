import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  clearFileContentCache,
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
    const stored = getStoredGitHubToken();
    setHasToken(Boolean(stored));
    // Never echo an existing credential back into the DOM.
    setToken("");
  }, [open]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = token.trim();
    if (!normalized) return;
    setStoredGitHubToken(normalized);
    setToken("");
    setHasToken(true);
    toast.success("GitHub token saved locally. Requests will be retried with it.");
    onCredentialChange?.();
    onClose();
  };

  const clear = () => {
    setStoredGitHubToken(null);
    void clearFileContentCache();
    setToken("");
    setHasToken(false);
    toast.success("GitHub token and cached file contents removed from this browser.");
    onCredentialChange?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="GitHub API settings"
      description="Optional authentication for a higher request budget and repositories your token can read."
    >
      <form onSubmit={save} className="space-y-4 p-4">
        <div className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
          <p className="text-xs leading-relaxed text-muted">
            The token is stored only in this browser's localStorage and sent only to
            <span className="font-mono text-ink"> api.github.com</span>. RepoLens has no backend
            and cannot receive it. A fine-grained, read-only token is recommended.
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-ink">
            Personal access token
            {hasToken ? <span className="font-normal text-ok">Token stored</span> : null}
          </span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={hasToken ? "Paste a replacement token" : "github_pat_… or ghp_…"}
              autoComplete="off"
              spellCheck={false}
              aria-label="GitHub personal access token"
              className="h-10 w-full rounded-lg border border-line bg-bg pl-9 pr-3 font-mono text-xs text-ink placeholder:text-faint transition-colors duration-150 hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </label>

        <div className="flex items-center justify-between gap-3">
          {hasToken ? (
            <Button type="button" variant="danger" size="sm" onClick={clear}>
              <Trash2 className="h-3.5 w-3.5" />
              Remove token
            </Button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!token.trim()}>
              Save token
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}