import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export function Badge({
  children,
  className,
  tone = "neutral",
  title,
  dot,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "ok" | "warn" | "danger" | "info";
  title?: string;
  dot?: boolean;
}) {
  const tones = {
    neutral: "border-line-strong/80 bg-surface-2/90 text-muted",
    accent: "border-accent-border bg-accent-soft text-accent shadow-[0_0_12px_-3px_var(--rl-accent-glow)]",
    ok: "border-ok/30 bg-ok/10 text-ok",
    warn: "border-accent/40 bg-accent-soft text-accent",
    danger: "border-danger/30 bg-danger/10 text-danger",
    info: "border-info/30 bg-info/10 text-info",
  } as const;

  const dotColors = {
    neutral: "bg-muted",
    accent: "bg-accent shadow-[0_0_6px_var(--rl-accent)]",
    ok: "bg-ok",
    warn: "bg-accent",
    danger: "bg-danger",
    info: "bg-info",
  } as const;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 tracking-normal",
        tones[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[tone])}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line/80 bg-surface-2/70 px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-line-strong hover:text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 h-5 items-center justify-center rounded border border-line-strong bg-surface-2/90 px-1.5 font-mono text-[10px] font-medium text-muted shadow-[inset_0_-1px_0_var(--rl-border),0_1px_2px_rgba(0,0,0,0.2)]">
      {children}
    </kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-2", className)}
      aria-hidden="true"
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent",
        className,
      )}
    />
  );
}

export function Tooltip({
  label,
  children,
  side = "bottom",
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-strong bg-elevated px-2 py-1 text-[11px] text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "bottom" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]",
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function SectionHeading({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent-border/50 bg-accent-soft text-accent">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line/80 bg-surface/80 p-3.5 shadow-sm transition-all duration-150 hover:border-line-strong hover:bg-surface rl-hairline-top">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</p>
        {icon ? <span className="text-faint/70 group-hover:text-accent transition-colors">{icon}</span> : null}
      </div>
      <p className="mt-1.5 font-mono text-xl font-medium tracking-tight text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2 border border-line/40">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(2, value * 100))}%` }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="h-full rounded-full"
        style={{ backgroundColor: color ?? "var(--rl-accent)" }}
      />
    </div>
  );
}
