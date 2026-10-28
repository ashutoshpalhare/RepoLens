import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Moon, ScanEye, Sun } from "lucide-react";
import { REPO_URL, SITE } from "@/lib/site";
import { useThemeUI } from "@/lib/theme-provider";
import { EASE_OUT } from "@/lib/motion";
import { GithubMark } from "@/components/ui/BrandIcons";
import { cn } from "@/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent-border/60 bg-accent-soft text-accent shadow-[0_0_14px_-3px_var(--rl-accent-glow)] transition-all duration-200 group-hover:border-accent group-hover:scale-105">
        <ScanEye className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      </span>
      <span className="flex items-baseline gap-1.5 font-semibold tracking-tight text-ink">
        <span className="text-sm font-bold">Repo</span>
        <span className="text-sm font-bold text-accent">Lens</span>
        <span className="hidden sm:inline-block rounded border border-line-strong/60 bg-surface-2/80 px-1 py-0.2 text-[9px] font-mono font-medium uppercase tracking-wider text-faint">
          web
        </span>
      </span>
    </span>
  );
}

/** Shared top bar for the marketing pages. */
export function SiteHeader({ active }: { active?: "home" | "about" }) {
  const { theme, toggle } = useThemeUI();

  const link = (to: "/" | "/about", label: string, isActive?: boolean) => (
    <Link
      to={to}
      className={cn(
        "relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 sm:text-sm",
        isActive
          ? "bg-accent-soft/80 text-accent font-semibold border border-accent-border/40"
          : "text-muted hover:bg-surface-2 hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      {label}
    </Link>
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
      className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={`${SITE.name} home`}
        >
          <Logo />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-1.5">
          {link("/", "Home", active === "home" || !active)}
          {link("/about", "About", active === "about")}
          <div className="mx-1 h-4 w-px bg-line/80" />
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-transparent text-muted transition-colors duration-150 hover:border-line hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${SITE.name} on GitHub`}
            title="Star RepoLens on GitHub"
            className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg border border-transparent text-muted transition-colors duration-150 hover:border-line hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <GithubMark className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
