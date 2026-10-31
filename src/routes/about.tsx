import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Copy,
  ExternalLink,
  FolderTree,
  Gauge,
  Keyboard,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";
import { SiteHeader } from "@/components/repolens/SiteHeader";
import { SocialDock } from "@/components/repolens/SocialDock";
import { GithubMark, LinkedinMark, XMark } from "@/components/ui/BrandIcons";
import { Badge, Chip, Kbd } from "@/components/ui/primitives";
import { fadeUp, stagger } from "@/lib/motion";
import { AUTHOR, CONTRIB_URL, EXAMPLE_REPOS, ISSUES_URL, REPO_URL, SITE } from "@/lib/site";

const FEATURES = [
  { icon: <FolderTree className="h-5 w-5" />, index: "01", title: "Explore the whole tree", body: "Navigate nested folders, filter paths and expand or collapse directories without losing your place." },
  { icon: <Search className="h-5 w-5" />, index: "02", title: "Find files instantly", body: "Use fuzzy quick-open with Ctrl/Cmd + P, keyboard navigation and highlighted matches." },
  { icon: <Gauge className="h-5 w-5" />, index: "03", title: "Read repository signals", body: "See language distribution, large files, hot folders, manifests and useful repository statistics." },
  { icon: <Compass className="h-5 w-5" />, index: "04", title: "Map the architecture", body: "Inspect files grouped into UI, client, state, core, styling, tests, infrastructure and docs layers." },
  { icon: <Copy className="h-5 w-5" />, index: "05", title: "Take the structure with you", body: "Copy directory trees and paths at different depths for documentation, reviews and AI coding workflows." },
  { icon: <ShieldCheck className="h-5 w-5" />, index: "06", title: "Stay in control", body: "A static client-side app with no RepoLens backend, account system, analytics or telemetry." },
];

const STACK = [
  { name: "React 19", note: "UI runtime" }, { name: "TypeScript", note: "type safety" },
  { name: "TanStack Router", note: "routing" }, { name: "TanStack Query", note: "fetch + cache" },
  { name: "Tailwind CSS v4", note: "styling" }, { name: "Vite", note: "static build" },
  { name: "Framer Motion", note: "motion" }, { name: "Lucide", note: "icons" },
  { name: "GitHub REST API", note: "repository data" }, { name: "raw.githubusercontent", note: "file contents" },
];

const STEPS = [
  { number: "01", title: "Drop in a GitHub URL", body: "Paste a repository URL, a tree/blob deep link or owner/repo. RepoLens parses the input in your browser." },
  { number: "02", title: "Explore files and code", body: "Browse the repository tree, open files in the syntax-highlighted viewer and jump between paths." },
  { number: "03", title: "Understand the shape", body: "Use insights and architecture signals to get oriented before you dive into implementation details." },
];

const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const primary = base + " bg-accent text-accent-contrast hover:bg-accent-strong";
const secondary = base + " border border-line-strong bg-surface/70 text-ink hover:border-accent hover:bg-accent-soft";

export function AboutPage() {
  const example = EXAMPLE_REPOS[1]!;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] rl-grid-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <SiteHeader active="about" />

      <main id="main" className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.header variants={stagger(0.08)} initial="hidden" animate="show" className="relative py-16 sm:py-24">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">The story behind {SITE.name}</Badge>
            <Badge tone="neutral">{SITE.license} licensed · Open source</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Get the shape of a codebase. <span className="text-accent">Before getting lost in it.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-lg">
            {SITE.tagline} RepoLens turns a GitHub repository into an explorable workspace — so you can find files, inspect code and understand structure without setting up a local environment.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link to="/r/$owner/$repo/$" params={{ owner: example.owner, repo: example.repo, _splat: "" }} className={primary}>
              Explore a sample repo <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className={secondary}>
              View source on GitHub <ExternalLink className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              { value: "100%", label: "Client-side experience" },
              { value: "0", label: "RepoLens backend services" },
              { value: "MIT", label: "Open-source license" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-line bg-surface/65 p-5 rl-hairline-top">
                <p className="font-mono text-2xl font-semibold tracking-tight text-accent">{item.value}</p>
                <p className="mt-1 text-xs text-muted">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.header>

        <section className="grid gap-8 border-y border-line py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">01 / Why RepoLens</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">A repository link should be a starting point, not a setup task.</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
            <p>Understanding an unfamiliar project often means cloning it, installing dependencies, finding the entry point and tracing folders before you can answer a simple question: where does this thing actually live?</p>
            <p><strong className="font-medium text-ink">RepoLens shortens that first pass.</strong> It fetches public repository metadata and the Git tree from GitHub, then renders the experience locally in your browser. Open a file, inspect its contents, scan project signals and move on with a clearer mental model.</p>
            <p>It is an exploration aid, not a replacement for running the project, reading every implementation detail or performing a full security review.</p>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="capabilities">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">02 / Capabilities</p>
              <h2 id="capabilities" className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Built for code comprehension.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">The practical tools you need to get oriented, grouped in one focused workspace.</p>
          </div>
          <motion.ul variants={stagger(0.055)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <motion.li key={feature.index} variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.18 }} className="group rounded-2xl border border-line bg-surface/65 p-5 transition-colors hover:border-accent-border hover:bg-surface/90 rl-hairline-top">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent-border/60 bg-accent-soft text-accent">{feature.icon}</span>
                  <span className="font-mono text-xs text-faint">{feature.index}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink transition-colors group-hover:text-accent">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section className="rounded-3xl border border-line bg-surface/55 p-6 sm:p-9 lg:p-10" aria-labelledby="workflow">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">03 / Workflow</p>
            <h2 id="workflow" className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">From URL to understanding in three steps.</h2>
          </div>
          <motion.ol variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} className="mt-9 grid gap-4 lg:grid-cols-3">
            {STEPS.map((step) => (
              <motion.li key={step.number} variants={fadeUp} className="rounded-2xl border border-line bg-bg/50 p-5">
                <span className="font-mono text-sm text-accent">{step.number}</span>
                <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
              </motion.li>
            ))}
          </motion.ol>
          <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Workflow className="h-4 w-4 text-accent" />
            <span>Shortcut:</span><Kbd>Ctrl/Cmd</Kbd><span>+</span><Kbd>P</Kbd><span>opens quick file search inside a workspace.</span>
          </div>
        </section>

        <section className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">04 / Under the hood</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">A modern frontend. A deliberately small footprint.</h2>
            <p className="mt-4 text-sm leading-6 text-muted">The app is built as a static site and deployed to GitHub Pages. Repository data comes from GitHub's APIs; RepoLens does not run its own application server.</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface/65 p-5 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles className="h-4 w-4 text-accent" /> Technology stack</div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {STACK.map((item) => <li key={item.name}><Chip><span className="text-ink">{item.name}</span><span className="text-faint"> · {item.note}</span></Chip></li>)}
            </ul>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-24 rounded-3xl border border-accent-border/50 bg-accent-soft/30 p-6 sm:p-9" aria-labelledby="privacy-title">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">05 / Privacy & limitations</p>
              <h2 id="privacy-title" className="mt-3 text-3xl font-semibold tracking-tight text-ink">Your repository exploration stays in your browser.</h2>
              <p className="mt-3 text-sm leading-6 text-muted">There is no RepoLens backend, database, account system, analytics or telemetry. Public repository metadata and file contents are requested directly from GitHub endpoints and rendered client-side.</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-lg">
              <div className="rounded-2xl border border-line bg-surface/80 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Lock className="h-4 w-4 text-accent" /> What to know</h3>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                  <li>• Theme and panel preferences are stored in localStorage.</li>
                  <li>• Optional read-only tokens are stored in your browser and sent directly to GitHub.</li>
                  <li>• File contents are not uploaded to a RepoLens server.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-line bg-surface/80 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><ShieldCheck className="h-4 w-4 text-accent" /> Current limits</h3>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                  <li>• GitHub unauthenticated API limits apply (typically 60 requests/hour per IP).</li>
                  <li>• Private repositories need an optional token.</li>
                  <li>• Very large files may open on GitHub instead of rendering locally.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">06 / The maker</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Built by a developer who likes understanding how things fit together.</h2>
          </div>
          <div className="rounded-3xl border border-line bg-surface/70 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent-border bg-accent-soft text-accent"><GithubMark className="h-7 w-7" /></div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-ink">{AUTHOR.name}</h3>
                <p className="mt-1 text-xs text-accent">{AUTHOR.role}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">{AUTHOR.bio}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {AUTHOR.socials.map((social) => (
                <li key={social.id}>
                  <a href={social.href} target="_blank" rel="noreferrer noopener" aria-label={social.label} title={social.label} className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted transition-colors hover:border-accent hover:text-accent">
                    {social.icon === "github" ? <GithubMark className="h-4 w-4" /> : social.icon === "linkedin" ? <LinkedinMark className="h-4 w-4" /> : social.icon === "x" ? <XMark className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-line bg-surface/70 p-7 text-center sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rl-grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="relative">
            <Badge tone="accent"><Star className="mr-1 inline h-3 w-3" /> Open source · {SITE.license}</Badge>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Have an idea to make repository exploration better?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">Explore the code, report a bug or contribute an improvement. Issues and pull requests are welcome.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className={primary}><GithubMark className="h-4 w-4" /> View repository <ExternalLink className="h-3.5 w-3.5" /></a>
              <a href={CONTRIB_URL} target="_blank" rel="noreferrer noopener" className={secondary}>Contribution guide</a>
              <a href={ISSUES_URL} target="_blank" rel="noreferrer noopener" className={secondary}>Report an issue</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-line bg-surface/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-7 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-faint">{SITE.name} · {SITE.license} · Built for the open-source community</p>
          <SocialDock className="flex-row sm:flex-col" withMail={false} />
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;
