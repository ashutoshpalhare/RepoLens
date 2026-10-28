import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Copy,
  FolderTree,
  Gauge,
  GitFork,
  Keyboard,
  Lock,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/repolens/SiteHeader";
import { SocialDock } from "@/components/repolens/SocialDock";
import { GithubMark, LinkedinMark, XMark } from "@/components/ui/BrandIcons";
import { Badge, Chip, Kbd } from "@/components/ui/primitives";
import { fadeUp, stagger } from "@/lib/motion";
import { AUTHOR, CONTRIB_URL, EXAMPLE_REPOS, ISSUES_URL, REPO_URL, SITE } from "@/lib/site";

const FEATURES = [
  {
    icon: <FolderTree className="h-4 w-4" />,
    title: "File explorer",
    body: "Full repository tree with folder animation, filter, expand/collapse all and per-file type icons.",
  },
  {
    icon: <Search className="h-4 w-4" />,
    title: "Fuzzy quick open",
    body: "Ctrl/Cmd + P searches every path in the repo, with keyboard navigation and match highlighting.",
  },
  {
    icon: <Gauge className="h-4 w-4" />,
    title: "Insights panel",
    body: "Language mix, hot folders, largest files, dependency manifests and repository stats.",
  },
  {
    icon: <Compass className="h-4 w-4" />,
    title: "Architecture analysis",
    body: "Files grouped into UI, client, state, core, styling, tests, infra and docs layers plus health signals.",
  },
  {
    icon: <Copy className="h-4 w-4" />,
    title: "Copy tree & paths",
    body: "Copy an ASCII directory tree at depth 2, 3, all files or folders-only — perfect for docs and prompts.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Runs in your browser",
    body: "Static build, no backend, no accounts, no analytics. Nothing is uploaded anywhere.",
  },
];

const STACK = [
  { name: "React 19", note: "UI runtime" },
  { name: "TypeScript", note: "type safety" },
  { name: "TanStack Router", note: "hash routing" },
  { name: "TanStack Query", note: "GitHub fetch + cache" },
  { name: "Tailwind CSS v4", note: "design tokens" },
  { name: "Vite", note: "static build" },
  { name: "Framer Motion", note: "150–300ms motion" },
  { name: "Lucide", note: "icons" },
  { name: "Sonner", note: "toasts" },
  { name: "GitHub REST API", note: "repo + tree" },
  { name: "raw.githubusercontent", note: "file contents" },
];

const ctaBase =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium " +
  "transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const ctaPrimary = `${ctaBase} bg-accent text-accent-contrast hover:bg-accent-strong`;
const ctaOutline = `${ctaBase} border border-line-strong bg-surface/60 text-ink hover:border-accent hover:bg-accent-soft`;
const ctaGhost = `${ctaBase} text-muted hover:bg-surface-2 hover:text-ink`;

const STEPS = [
  {
    title: "Paste a repository URL",
    body: "Full URL, tree/blob deep link or plain owner/repo — RepoLens parses it locally and opens the workspace.",
  },
  {
    title: "Browse the tree and read code",
    body: "The recursive git tree is fetched once, then rendered as an explorer plus a syntax-highlighted viewer.",
  },
  {
    title: "Skim insights & architecture",
    body: "Language mix, biggest files, hot folders and layer signals give you the shape of the project in seconds.",
  },
];

export function AboutPage() {
  const example = EXAMPLE_REPOS[1]!;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 rl-grid-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
      />

      <SiteHeader active="about" />

      <main id="main" className="relative mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        {/* ----------------------------------------------------------- hero */}
        <motion.header variants={stagger(0.07)} initial="hidden" animate="show" className="pt-12 sm:pt-16">
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <Badge tone="accent">About {SITE.name}</Badge>
            <Badge tone="neutral">{SITE.license} licensed</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl"
          >
            A repository explorer that <span className="text-accent">never phones home.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-pretty text-sm leading-relaxed text-muted sm:text-base">
            {SITE.tagline} Paste a link, read the code, copy the tree, understand the architecture —
            without cloning, without an account, without sending your activity to anyone.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              to="/r/$owner/$repo/$"
              params={{ owner: example.owner, repo: example.repo, _splat: "" }}
              className={ctaPrimary}
            >
              Try it on {example.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/" className={ctaOutline}>
              Back to home
            </Link>
          </motion.div>
        </motion.header>

        <Divider />

        {/* --------------------------------------------------- what it is */}
        <Section title="What is RepoLens?" icon={<ScrollText className="h-4 w-4" />}>
          <p className="text-sm leading-relaxed text-muted">
            RepoLens is a <strong className="font-medium text-ink">static, client-side</strong>{" "}
            GitHub repository explorer. It loads a repository's metadata and full file tree from the
            public GitHub REST API, fetches individual file contents from raw.githubusercontent.com,
            and renders an IDE-like workspace in your browser. There is no backend, no database, no
            build-time scraping and no server-side analysis.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The whole app ships as static files to GitHub Pages, which is why deep links use a hash
            route — it works on any static host without rewrite rules.
          </p>
        </Section>

        <Divider />

        {/* ------------------------------------------------------ features */}
        <Section title="Features" icon={<Star className="h-4 w-4" />}>
          <motion.ul
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {FEATURES.map((feature) => (
              <motion.li
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                className="rounded-2xl border border-line bg-surface/70 p-4 transition-colors duration-200 hover:border-accent-border"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  {feature.icon}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </Section>

        <Divider />

        {/* -------------------------------------------------- how it works */}
        <Section title="How it works" icon={<GitFork className="h-4 w-4" />}>
          <motion.ol
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-3"
          >
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                variants={fadeUp}
                className="flex gap-3.5 rounded-2xl border border-line bg-surface/70 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent-soft font-mono text-xs text-accent">
                  {index + 1}
                </span>
                <span>
                  <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{step.body}</p>
                </span>
              </motion.li>
            ))}
          </motion.ol>
        </Section>

        <Divider />

        {/* ----------------------------------------------------- tech stack */}
        <Section title="Tech stack" icon={<Keyboard className="h-4 w-4" />}>
          <ul className="flex flex-wrap gap-2">
            {STACK.map((item) => (
              <li key={item.name}>
                <Chip>
                  <span className="text-ink">{item.name}</span>
                  <span className="text-faint">· {item.note}</span>
                </Chip>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">
            Everything is bundled by Vite — no runtime CDN scripts for app code, so the GitHub Pages
            build stays self-contained and works offline after first load.
          </p>
        </Section>

        <Divider />

        {/* ------------------------------------------------ privacy / limits */}
        <Section title="Privacy & limits" icon={<Lock className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface/70 p-4">
              <h3 className="text-sm font-semibold text-ink">What stays private</h3>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
                <li>• No accounts, no cookies, no analytics, no telemetry.</li>
                <li>• Panel layout and theme preferences live in localStorage only.</li>
                <li>• File contents are never uploaded — they are rendered locally.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface/70 p-4">
              <h3 className="text-sm font-semibold text-ink">Known limits</h3>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
                <li>• Unauthenticated GitHub API limit: 60 requests/hour per IP.</li>
                <li>• Private repositories require an optional read-only token in Settings.</li>
                <li>• Files larger than ~1.5 MB open on GitHub instead of rendering locally.</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            An optional read-only personal access token can be added from workspace Settings. It is
            stored only in your browser's localStorage and sent directly to api.github.com.
          </p>
        </Section>

        <Divider />

        {/* --------------------------------------------------------- author */}
        <Section title="Built by" icon={<Star className="h-4 w-4" />}>
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <GithubMark className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{AUTHOR.name}</h3>
                <p className="mt-0.5 text-xs text-accent">{AUTHOR.role}</p>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">{AUTHOR.bio}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {AUTHOR.socials.map((social) => (
                    <li key={social.id}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={social.label}
                        title={social.label}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
                      >
                        {social.icon === "github" ? (
                          <GithubMark className="h-4 w-4" />
                        ) : social.icon === "linkedin" ? (
                          <LinkedinMark className="h-4 w-4" />
                        ) : social.icon === "x" ? (
                          <XMark className="h-4 w-4" />
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ---------------------------------------------------- open source */}
        <Section title="Open source" icon={<GitFork className="h-4 w-4" />}>
          <div className="rounded-2xl border border-line bg-surface/70 p-5">
            <p className="text-sm leading-relaxed text-muted">
              RepoLens is released under the {SITE.license} license. Issues, ideas and pull requests
              are welcome — the design tokens, accessibility rules and sprint plan all live in the
              repository's CONTRIBUTING.md.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className={ctaPrimary}>
                <GithubMark className="h-4 w-4" />
                Star on GitHub
              </a>
              <a href={CONTRIB_URL} target="_blank" rel="noreferrer noopener" className={ctaOutline}>
                Read CONTRIBUTING.md
              </a>
              <a href={ISSUES_URL} target="_blank" rel="noreferrer noopener" className={ctaGhost}>
                Report an issue
              </a>
            </div>
          </div>
        </Section>

        <p className="mt-8 flex flex-wrap items-center gap-2 text-[11px] text-faint">
          <span>Shortcut of the day:</span>
          <Kbd>?</Kbd>
          <span>opens the full shortcut list inside any workspace.</span>
        </p>
      </main>

      <footer className="relative border-t border-line bg-surface/40">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-xs text-faint">
            {SITE.name} · {SITE.license} · static build for GitHub Pages
          </p>
          <SocialDock className="flex-row sm:flex-col" withMail={false} />
        </div>
      </footer>
    </div>
  );
}

function Divider() {
  return <hr className="my-10 border-line sm:my-12" />;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <h2
        id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink"
      >
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

export default AboutPage;
