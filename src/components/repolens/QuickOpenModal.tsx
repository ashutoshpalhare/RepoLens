import { useEffect, useMemo, useRef, useState } from "react";
import { FileCode2, Search, X } from "lucide-react";
import { FileTypeIcon } from "@/components/repolens/FileTypeIcon";
import { fuzzyFilter } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

export function QuickOpenModal({
  open,
  onClose,
  paths,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  paths: string[];
  onSelect: (path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(
    () => fuzzyFilter(paths, query, (p) => p, 80),
    [paths, query],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

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

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const choose = (path: string) => {
    onSelect(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Quick open file"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const hit = results[active];
                if (hit) choose(hit);
              }
            }}
            placeholder="Type a file path…"
            aria-label="Filter files"
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto py-1" role="listbox">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No files match “{query}”.
            </li>
          ) : (
            results.map((path, idx) => (
              <li key={path} role="option" aria-selected={idx === active} data-idx={idx}>
                <button
                  type="button"
                  onClick={() => choose(path)}
                  onMouseEnter={() => setActive(idx)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs transition-colors",
                    idx === active ? "bg-primary/15 text-foreground" : "text-foreground/85 hover:bg-accent/70",
                  )}
                >
                  <FileTypeIcon path={path} />
                  <span className="min-w-0 truncate">{path}</span>
                  {idx === active && (
                    <FileCode2 className="ml-auto size-3.5 shrink-0 text-primary" aria-hidden />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex gap-3 border-t border-border px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}