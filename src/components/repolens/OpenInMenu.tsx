import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, FileCode2, SquareCode } from "lucide-react";
import {
  fileUrl,
  github1sUrl,
  githubDevUrl,
  repoUrl,
  vscodeCloneUrl,
} from "@/lib/github";
import { cn } from "@/lib/utils";

export function OpenInMenu({
  owner,
  repo,
  branch,
  filePath,
  className,
}: {
  owner: string;
  repo: string;
  branch: string;
  filePath?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items: {
    id: string;
    label: string;
    hint?: string;
    href?: string;
    disabled?: boolean;
  }[] = [
    {
      id: "github",
      label: "Open on GitHub",
      hint: "Repository home",
      href: repoUrl(owner, repo),
    },
    {
      id: "file",
      label: "Current file on GitHub",
      hint: filePath ?? "Select a file first",
      href: filePath ? fileUrl(owner, repo, branch, filePath) : undefined,
      disabled: !filePath,
    },
    {
      id: "github1s",
      label: "Open in github1s",
      hint: "VS Code in the browser",
      href: github1sUrl(owner, repo),
    },
    {
      id: "githubdev",
      label: "Open in github.dev",
      hint: "Press . on GitHub",
      href: githubDevUrl(owner, repo),
    },
    {
      id: "vscode",
      label: "Clone in VS Code",
      hint: "Desktop app",
      href: vscodeCloneUrl(owner, repo),
    },
  ];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      >
        Open in
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-40 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              {item.disabled || !item.href ? (
                <span className="flex cursor-not-allowed flex-col gap-0.5 px-3 py-2 opacity-50">
                  <span className="text-xs text-foreground">{item.label}</span>
                  {item.hint && (
                    <span className="font-mono text-[10px] text-muted-foreground">{item.hint}</span>
                  )}
                </span>
              ) : (
                <a
                  role="menuitem"
                  href={item.href}
                  target={item.id === "vscode" ? undefined : "_blank"}
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2 px-3 py-2 transition-colors hover:bg-accent"
                >
                  <span className="mt-0.5 text-muted-foreground">
                    {item.id === "file" ? (
                      <FileCode2 className="size-3.5" />
                    ) : item.id === "github1s" || item.id === "githubdev" ? (
                      <SquareCode className="size-3.5" />
                    ) : (
                      <ExternalLink className="size-3.5" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs text-foreground">{item.label}</span>
                    {item.hint && (
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {item.hint}
                      </span>
                    )}
                  </span>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
