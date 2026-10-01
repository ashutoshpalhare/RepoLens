import { useEffect } from "react";
import { X } from "lucide-react";

const ROWS: { keys: string; action: string }[] = [
  { keys: "Ctrl/⌘ P", action: "Quick open file" },
  { keys: "Ctrl/⌘ B", action: "Focus files filter (Code tab)" },
  { keys: ".", action: "Open repo in github.dev" },
  { keys: "?", action: "Show this shortcuts help" },
  { keys: "Esc", action: "Close modal / dialog" },
];

export function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="shortcuts-title" className="text-sm font-semibold text-foreground">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="divide-y divide-border px-2 py-1">
          {ROWS.map((row) => (
            <li key={row.keys} className="flex items-center justify-between gap-4 px-2 py-2.5">
              <span className="text-sm text-foreground/90">{row.action}</span>
              <kbd className="shrink-0 rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {row.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Shortcuts are ignored while typing in an input or textarea.
        </p>
      </div>
    </div>
  );
}