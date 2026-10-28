import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Kbd, Skeleton } from "@/components/ui/primitives";
import { FileTypeIcon } from "./FileIcon";
import { markIndices, rankFuzzy } from "@/lib/fuzzy";
import { cn } from "@/utils/cn";

export type QuickOpenProps = {
  open: boolean;
  onClose: () => void;
  paths: string[];
  loading?: boolean;
  onSelect: (path: string) => void;
};

/** Fuzzy file finder (Ctrl/Cmd + P). */
export function QuickOpenModal({ open, onClose, paths, loading, onSelect }: QuickOpenProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const results = useMemo(
    () =>
      query.trim()
        ? rankFuzzy(query.trim(), paths, (p) => p, 50)
        : paths.slice(0, 50).map((item) => ({ item, score: 0, indices: [] as number[] })),
    [query, paths],
  );

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.children[active] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (path: string) => {
    onSelect(path);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick open" bare align="top" className="max-w-xl">
      <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
        <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter" && results[active]) {
              event.preventDefault();
              choose(results[active]!.item);
            }
          }}
          aria-label="Search files by name"
          placeholder="Start typing a file name…"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        <span className="shrink-0 font-mono text-[10px] text-faint">
          {loading ? "indexing…" : `${paths.length} files`}
        </span>
      </div>

      <ul
        ref={listRef}
        role="listbox"
        aria-label="Matching files"
        className="rl-scroll max-h-[52vh] overflow-y-auto p-1.5"
      >
        {loading ? (
          <li className="space-y-2 p-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-7 w-1/2" />
          </li>
        ) : results.length === 0 ? (
          <li className="px-3 py-8 text-center text-xs text-muted">
            No file matches “{query}”.
          </li>
        ) : (
          results.map((result, index) => {
            const path = result.item;
            const name = path.split("/").pop() ?? path;
            const dir = path.split("/").slice(0, -1).join("/");
            const nameParts = markIndices(name, result.indices);
            return (
              <li key={path} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(path)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
                    index === active ? "bg-accent-soft" : "hover:bg-surface-2",
                  )}
                >
                  <FileTypeIcon path={path} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs text-ink">
                      {nameParts.map((part, i) => (
                        <span
                          key={i}
                          className={part.hit ? "text-accent" : undefined}
                        >
                          {part.text}
                        </span>
                      ))}
                    </span>
                    {dir ? (
                      <span className="block truncate font-mono text-[10px] text-faint">
                        {dir}
                      </span>
                    ) : null}
                  </span>
                  {index === active ? <Kbd>↵</Kbd> : null}
                </button>
              </li>
            );
          })
        )}
      </ul>

      <footer className="flex items-center gap-3 border-t border-line px-3.5 py-2 text-[11px] text-faint">
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
        <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
        <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
      </footer>
    </Modal>
  );
}
