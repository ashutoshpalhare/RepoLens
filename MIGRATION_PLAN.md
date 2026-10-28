# RepoLens Opus 5.5 Migration Plan

## Goal

Replace the current TanStack Start application with the reviewed Opus 5.5 Vite + React single-page application, while preserving the existing `main` branch until the replacement is validated.

## Source of truth

- Migration input: `RepoLens-Opus5.5-Pages-Ready.zip`
- Target deployment: GitHub Pages at `/RepoLens/`
- Package manager: npm, using the committed `package-lock.json`
- Runtime model: static, client-side application; no application server required

## Day 1 sequence

1. Create and work only on `migration/opus-5.5-pages-spa`.
2. Replace the TanStack Start application with the reviewed Vite SPA source and configuration.
3. Preserve repository governance files such as `LICENSE` and `CONTRIBUTING.md`; review README claims against the actual implementation.
4. Update GitHub Actions to run on pushes to the migration branch and pull requests, install with `npm ci`, run `npm run typecheck`, and run `npm run build`.
5. Verify that `dist/index.html` exists and that asset URLs use the `/RepoLens/` base path.
6. Record validation honestly. Do not claim a successful local build when dependency installation or network access prevents it.
7. Open a draft pull request for review only after the source snapshot and CI workflow are coherent.

## Commit policy

- Every commit must represent a real, reviewable change.
- Do not create empty, artificial, or backdated commits.
- Prefer cohesive changes with descriptive messages over splitting one change into arbitrary commit counts.
- Keep `main` untouched until the migration has passed its checks and has been reviewed.

## Known validation blocker

A local `npm ci` attempt on 2026-10-28 did not finish before the execution timeout. This is not a passing build; retry dependency installation and CI when network access is available.
