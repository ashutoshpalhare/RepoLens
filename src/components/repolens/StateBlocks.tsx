import { motion, type Variants } from "framer-motion";
import { AlertTriangle, FolderOpen, SearchX } from "lucide-react";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/primitives";
import { EASE_OUT } from "@/lib/motion";

/** Shared loading / empty / error blocks — soft fade-in, never an abrupt pop. */
const wrap = "flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center";

const variants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

export function LoadingState({
  label = "Loading…",
  detail,
  className,
}: {
  label?: string;
  detail?: string;
  className?: string;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(wrap, className)}
    >
      <div className="w-full max-w-[220px] space-y-2" aria-hidden="true">
        <Skeleton className="mx-auto h-3 w-2/3" />
        <Skeleton className="mx-auto h-3 w-full" />
        <Skeleton className="mx-auto h-3 w-4/5" />
      </div>
      <p className="text-sm text-muted">{label}</p>
      {detail ? <p className="max-w-sm text-xs text-faint">{detail}</p> : null}
    </motion.div>
  );
}

export function EmptyState({
  title,
  detail,
  icon,
  action,
  className,
}: {
  title: string;
  detail?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(wrap, className)}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-faint">
        {icon ?? <FolderOpen className="h-5 w-5" />}
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? (
        <p className="max-w-sm text-xs leading-relaxed text-muted">{detail}</p>
      ) : null}
      {action}
    </motion.div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
  onRetry,
  retryLabel = "Retry",
  action,
  className,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      role="alert"
      className={cn(wrap, className)}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? (
        <p className="max-w-sm text-xs leading-relaxed text-muted">{detail}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {retryLabel}
        </button>
      ) : null}
      {action}
    </motion.div>
  );
}

export function NotFoundFileState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={<SearchX className="h-5 w-5" />}
      title="No file selected"
      detail="Pick a file from the explorer, or press Ctrl/Cmd + P to fuzzy-search every path in this repository."
      action={
        <button
          type="button"
          onClick={onBrowse}
          className="mt-1 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          Browse files
        </button>
      }
    />
  );
}
