import {
  ArrowUpRight,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Rss,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SocialLink {
  label: string;
  href: string;
  icon: typeof Github;
}

/** Real profile links, sourced from ashutoshpalhare.github.io/BioLinksV2. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/ashutoshpalhare", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ashutoshpalhare", icon: Linkedin },
  { label: "Portfolio", href: "https://ashutoshpalhare.github.io", icon: Globe },
  { label: "Blog", href: "https://ashutoshpalhare.github.io", icon: Rss },
  { label: "Instagram", href: "https://www.instagram.com/ashutoshpalhare/", icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/ashutoshpalhare/", icon: Facebook },
  { label: "X / Twitter", href: "https://twitter.com/ashutoshpalhare", icon: Twitter },
];

const PRIMARY = ["GitHub", "Portfolio", "LinkedIn"];

function DockIcon({ link }: { link: SocialLink }) {
  const { icon: Icon, label, href } = link;
  return (
    <li className="group relative">
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener me"
        aria-label={label}
        className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary focus-visible:-translate-y-0.5 focus-visible:text-primary"
      >
        <Icon aria-hidden className="size-4" />
      </a>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 font-mono text-[10px] text-foreground opacity-0 shadow-panel transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </li>
  );
}

/** Compact developer profile dock: credit line, quick links and the full social row. */
export function SocialDock({ className }: { className?: string }) {
  return (
    <aside
      aria-label="About the author"
      className={cn("panel p-4 shadow-panel sm:p-5", className)}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 font-mono text-sm font-semibold text-primary"
        >
          AP
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Built by
          </p>
          <p className="truncate text-sm font-medium text-foreground">Ashutosh Palhare</p>
        </div>

        <div className="ml-auto flex flex-wrap gap-1.5">
          {SOCIAL_LINKS.filter((l) => PRIMARY.includes(l.label)).map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer noopener me"
              className="flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {l.label}
              <ArrowUpRight aria-hidden className="size-3" />
            </a>
          ))}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4" role="list">
        {SOCIAL_LINKS.map((l) => (
          <DockIcon key={l.label} link={l} />
        ))}
      </ul>
    </aside>
  );
}
