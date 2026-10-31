import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ copy */

export async function copyText(text: string, label = "Copied"): Promise<boolean> {
  try {
    // Clipboard API may exist but reject because of permissions or browser policy.
    // If that happens, fall back to the legacy selection-based copy path.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} ✓`);
        return true;
      } catch {
        // Continue to the fallback below.
      }
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.setAttribute("aria-hidden", "true");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);

    let copied = false;
    try {
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }

    if (!copied) throw new Error("Clipboard copy command was rejected");
    toast.success(`${label} ✓`);
    return true;
  } catch {
    toast.error("Copy failed — your browser blocked clipboard access.");
    return false;
  }
}

export function useCopy() {
  return useCallback((text: string, label?: string) => copyText(text, label), []);
}

/* -------------------------------------------------------------- shortcuts */

export type ShortcutHandlers = {
  onQuickOpen?: () => void;
  onFocusFilter?: () => void;
  onToggleExplorer?: () => void;
  onToggleInsights?: () => void;
  onOpenGithubDev?: () => void;
  onCopyTree?: () => void;
  onCopyPath?: () => void;
  onHelp?: () => void;
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return Boolean(el.isContentEditable);
}

/**
 * Global keyboard shortcuts. Single-key shortcuts are ignored while typing,
 * as are any shortcuts when a modifier we don't handle is involved.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key;
      const typing = isTyping(event.target);

      if (mod && !event.shiftKey && !event.altKey && key.toLowerCase() === "p") {
        event.preventDefault();
        ref.current.onQuickOpen?.();
        return;
      }

      if (mod && event.shiftKey && key.toLowerCase() === "f") {
        event.preventDefault();
        ref.current.onFocusFilter?.();
        return;
      }

      if (mod && !event.shiftKey && !event.altKey && key.toLowerCase() === "b") {
        event.preventDefault();
        ref.current.onToggleExplorer?.();
        return;
      }

      if (mod && key === "\\") {
        event.preventDefault();
        ref.current.onToggleInsights?.();
        return;
      }

      if (typing || mod || event.altKey) return;

      if (key === ".") {
        event.preventDefault();
        ref.current.onOpenGithubDev?.();
      } else if (key.toLowerCase() === "c") {
        event.preventDefault();
        ref.current.onCopyTree?.();
      } else if (key.toLowerCase() === "y") {
        event.preventDefault();
        ref.current.onCopyPath?.();
      } else if (key === "?") {
        event.preventDefault();
        ref.current.onHelp?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/* ------------------------------------------------------------------ theme */

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("repolens.theme") as Theme) || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem("repolens.theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, toggle };
}

/* ------------------------------------------------------------ misc helpers */

/** Persisted UI flag (panel visibility, tab, …). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`repolens.${key}`);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`repolens.${key}`, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
