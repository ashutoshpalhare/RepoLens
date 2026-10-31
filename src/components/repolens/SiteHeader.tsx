import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Moon, ScanEye, Sun } from "lucide-react";
import { REPO_URL, SITE } from "@/lib/site";
import { useThemeUI } from "@/lib/theme-provider";
import { EASE_OUT } from "@/lib/motion";
import { GithubMark } from "@/components/ui/BrandIcons";
import { cn } from "@/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("group flex shrink-0 items-center gap-2.5", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent-border/60 bg-accent-soft text-accent shadow-[0_0_14px_-3px_var(--rl-accent-glow)] transition-all duration-200 group-hover:scale-105 group-hover:border-accent">
        <ScanEye className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      </span>
      <span className="flex items-baseline gap-1.5 font-semibold tracking-tight text-ink">
        <span className="text-sm font-bold">Repo</span>
        <span className="text-sm font-bold text-accent">Lens</span>
        <span className="hidden rounded border border-line-strong/60 bg-surface-2/80 px-1 py-0.2 font-mono text-[9px] font-medium uppercase tracking-wider text-faint sm:inline-block">
          web
        </span>
      </span>
    </span>
  );
}

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "Workflow" },
  { href: "#privacy", label: "Privacy" },
] as const;

/** Shared top bar for the marketing pages. */
export function SiteHeader({ active }: { active?: "home" | "about" }) {
  const { theme, toggle } = useThemeUI();

  const linkClass =
    "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 sm:text-sm";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
      className="sticky top-0 z-40 border-b border-line/80 bg-bg/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={`${SITE.name} home`}
        >
          <Logo />
        </Link>

        <nav
          aria-label="Main navigation"
          className="ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1"
        >
          <Link
            to="/"
            aria-current={active === "home" || !active ? "page" : undefined}
            className={cn(
              linkClass,
              (active === "home" || !active) &&
                "border border-accent-border/40 bg-accent-soft/80 font-semibold text-accent",
            )}
          >
            Home
          </Link>
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </a>
          ))}
          <Link
            to="/about"
            aria-current={active === "about" ? "page" : undefined}
            className={cn(
              linkClass,
              active === "about" &&
                "border border-accent-border/40 bg-accent-soft/80 font-semibold text-accent",
            )}
          >
            About
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 border-l border-line/80 pl-2">
          <a
            href="#explore"
            className="hidden items-center gap-1 rounded-lg border border-accent-border/70 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex"
          >
            Explore repo
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted transition-colors duration-150 hover:border-line hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${SITE.name} on GitHub`}
            title="View RepoLens on GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted transition-colors duration-150 hover:border-line hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <GithubMark className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.header>
  );
}
