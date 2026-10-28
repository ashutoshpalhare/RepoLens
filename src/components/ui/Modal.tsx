import { useCallback, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "./Button";
import { cn } from "@/utils/cn";
import { EASE_OUT } from "@/lib/motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** hide the header (used by palette-style dialogs) */
  bare?: boolean;
  align?: "center" | "top";
};

/**
 * Accessible dialog: backdrop fade + panel scale/slide, Esc to close,
 * simple focus trap, focus restored to the trigger on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  bare = false,
  align = "center",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const reduce = useReducedMotion();

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    if (nodes.length === 0) return;
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      trapFocus(event);
    };
    document.addEventListener("keydown", onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const node = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (node ?? panelRef.current)?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex justify-center p-4",
            align === "center" ? "items-center" : "items-start pt-[8vh]",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 14 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className={cn(
              "relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line-strong",
              "bg-surface shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)]",
              className,
            )}
          >
            {bare ? (
              <div className="sr-only" id={titleId}>
                {title}
              </div>
            ) : (
              <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                <div>
                  <h2 id={titleId} className="text-sm font-semibold text-ink">
                    {title}
                  </h2>
                  {description ? (
                    <p id={descId} className="mt-0.5 text-xs text-muted">
                      {description}
                    </p>
                  ) : null}
                </div>
                <IconButton label="Close dialog" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </IconButton>
              </header>
            )}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
