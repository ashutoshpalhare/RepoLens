# Day 5 — Repository intelligence

## Scope delivered

- Dependency ecosystem detection for JavaScript/TypeScript, Python, Rust, Go, PHP, Ruby, Java/JVM, .NET, Dart/Flutter, Elixir, and Deno.
- Framework and tooling markers for Next.js, Nuxt, Angular, Svelte, Astro, Remix, Vite, Webpack, Turborepo, ESLint, Prettier, Vitest, Jest, Playwright, Cypress, Docker, GitHub Actions, TypeScript, and Node.js.
- A five-dimension structural health score with dimension-level evidence and recommendations.
- Partial-result labeling when GitHub reports a truncated recursive tree.

## Detection model

Detection is intentionally based on tracked file paths and known configuration names. It does not parse manifest contents, infer exact dependency versions, or claim that a framework is definitely installed merely because a similarly named package appears in a manifest.

Framework/tooling cards retain a small set of matching paths as evidence. Ecosystem rows distinguish manifests from lockfiles. Lockfile reproducibility is counted only when a recognized lockfile belongs to an ecosystem that also has a recognized manifest in the indexed tree.

## Health score

Each dimension contributes up to 20 points:

1. **Project documentation** — 10 points for a README and 10 for a license.
2. **Test structure** — 14 points when test-like files exist, or 20 when they represent at least 5% of indexed files.
3. **Automation** — 20 points when a GitHub Actions workflow is detected.
4. **Dependency reproducibility** — 20 points for a recognized manifest and matching lockfile, 10 for a manifest without a matching lockfile, and a neutral 10 when no dependency manifest is detected.
5. **Project configuration** — 20 points when recognized configuration files exist.

Grades are Strong (80–100), Promising (60–79), Needs attention (35–59), and Limited signals (0–34).

## Important limitations

- This is a **structural heuristic**, not a security audit, maintainability score, or code-quality certification.
- Test-file detection does not run tests and does not measure coverage.
- The analyzer does not inspect dependency versions, vulnerable packages, package scripts, or manifest contents.
- A missing README, license, test directory, CI workflow, or config file is a suggestion to review—not proof of a defect. Some repositories do not need every signal.
- GitHub's recursive tree API can truncate very large repositories. In that case, the score and detections use only the returned entries and are explicitly marked partial.
- The score is calculated locally in the browser from the repository tree already fetched by RepoLens; no RepoLens backend is involved.

## Validation

The production smoke suite covers ecosystem/lockfile pairing, framework and tooling markers, deterministic score calculation, partial-tree labeling, and recommendation wording. CI separately runs TypeScript validation, the production build, and the artifact smoke checks.

Automated checks do not replace manual browser QA of the deployed GitHub Pages site.
