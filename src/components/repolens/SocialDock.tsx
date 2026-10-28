import { motion } from "framer-motion";
import { Globe, Mail } from "lucide-react";
import { AUTHOR, type Social } from "@/lib/site";
import { GithubMark, LinkedinMark, XMark } from "@/components/ui/BrandIcons";
import { cn } from "@/utils/cn";

const ICONS: Record<Social["icon"], React.ComponentType<{ className?: string }>> = {
  github: GithubMark,
  linkedin: LinkedinMark,
  portfolio: Globe,
  x: XMark,
  mail: Mail,
};

type Props = {
  className?: string;
  /** include a mailto entry */
  withMail?: boolean;
  socials?: Social[];
};

/** Compact floating link dock for the author's profiles. */
export function SocialDock({ className, withMail = true, socials }: Props) {
  const items = socials ?? AUTHOR.socials;
  const list = withMail
    ? [...items, { id: "mail", label: "Email — ap4all@aol.com", href: "mailto:ap4all@aol.com", icon: "mail" as const }]
    : items;

  return (
    <nav
      aria-label="Author links"
      className={cn(
        "flex flex-col gap-1.5 rounded-2xl border border-line bg-surface/80 p-1.5 backdrop-blur-sm",
        className,
      )}
    >
      {list.map((social, index) => {
        const Icon = ICONS[social.icon];
        return (
          <motion.a
            key={social.id}
            href={social.href}
            target={social.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer noopener"
            aria-label={social.label}
            title={social.label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.2 }}
            whileHover={{ scale: 1.06, x: 2 }}
            whileTap={{ scale: 0.94 }}
            className="group flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon className="h-4 w-4" />
          </motion.a>
        );
      })}
    </nav>
  );
}
