import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, FolderTree, ListTree } from "lucide-react";
import { formatTreeAscii, type TreeNode } from "@/lib/analysis";
import { copyText } from "@/lib/hooks";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/utils/cn";

type Option = {
  id: string;
  label: string;
  hint: string;
  maxDepth?: number;
  foldersOnly?: boolean;
  icon: React.ReactNode;
};

const OPTIONS: Option[] = [
  { id: "d2", label: "Tree · depth 2", hint: "Fast overview", maxDepth: 2, icon: <ListTree className="h-3.5 w-3.5" /> },
  { id: "d3", label: "Tree · depth 3", hint: "Balanced", maxDepth: 3, icon: <ListTree className="h-3.5 w-3.5" /> },
  { id: "all", label: "Tree · all files", hint: "Every path", maxDepth: Infinity, icon: <ListTree className="h-3.5 w-3.5" /> },
  { id: "dirs", label: "Folders only", hint: "Structure skeleton", maxDepth: Infinity, foldersOnly: true, icon: <FolderTree className="h-3.5 w-3.5" /> },
];

/** Dropdown that copies the ASCII directory tree in a few flavours. */
export function CopyTreeMenu({
  nodes,
  rootName,
  className,
  compact = false,
}: {
  nodes: TreeNode[];
  rootName: string;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (option: Option) => {
    const text = formatTreeAscii(nodes, {
      maxDepth: option.maxDepth,
      foldersOnly: option.foldersOnly,
      rootName,
    });
    const ok = await copyText(text, `Copied ${option.label.toLowerCase()} (${text.split("\n").length} lines)`);
    if (ok) {
      setCopied(option.id);
      window.setTimeout(() => setCopied(null), 1600);
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Copy directory tree"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border text-xs transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          compact ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 text-xs",
          open
            ? "border-accent bg-accent-soft text-accent"
            : "border-line/80 bg-surface-2/60 text-muted hover:border-line-strong hover:bg-surface-2 hover:text-ink",
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5 text-faint" />}
        <span className="hidden sm:inline font-medium">{copied ? "Copied" : "Copy tree"}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="Copy directory tree options"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className={cn(
              "absolute bottom-full z-50 mb-1.5 w-60 overflow-hidden rounded-xl border border-line-strong/80 bg-surface/95 p-1.5",
              "shadow-[0_20px_50px_-16px_rgba(0,0,0,0.85)] backdrop-blur-md rl-hairline-top",
              compact ? "left-0" : "right-0",
            )}
          >
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                onClick={() => void run(option)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-none"
              >
                <span className="text-muted">{option.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-ink">{option.label}</span>
                  <span className="block text-[10px] text-faint">{option.hint}</span>
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
