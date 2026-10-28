# RepoLens

RepoLens is a fast, client-side GitHub repository explorer. Paste a public GitHub repository URL or `owner/repo` slug to browse its file tree, inspect syntax-highlighted source, and review codebase insights and architecture signals.

**Live site:** https://ashutoshpalhare.github.io/RepoLens/  
**Repository:** https://github.com/ashutoshpalhare/RepoLens

## Features

- Virtualized repository file tree with filtering and quick navigation
- Syntax-highlighted code viewer
- Repository metadata, language and file insights
- Client-side architecture analysis
- Keyboard shortcuts and quick-open
- Optional personal GitHub token stored locally in the browser to raise API rate limits
- Dark and light themes
- Responsive layout and reduced-motion support

## Privacy and data flow

RepoLens has no application backend. Repository information is fetched directly from the GitHub REST API and raw GitHub content from your browser. There is no RepoLens server receiving repository URLs or source files. If you choose to save a GitHub token in Settings, it is stored in your browser's local storage and sent only to `api.github.com` for API requests. Do not use a token on a shared or untrusted device.

GitHub's API rate limits apply. Public repositories can be explored without signing in or adding a token.

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- TanStack Router, Query and Virtual
- Shiki syntax highlighting
- Framer Motion and Lucide icons

## Requirements

- Node.js 22 (recommended)
- npm 10+

## Local development

```bash
npm ci
npm run dev
```

## Validation and production build

```bash
npm run typecheck
npm run build
npm run smoke
npm run preview
```

The production smoke check verifies generated HTML, single-file output, the GitHub Pages base path, route registration, and official GitHub API hosts. It checks the build artifact/configuration; it is not a replacement for testing interactive behavior in a browser.

The production build uses `vite-plugin-singlefile` to inline JavaScript and CSS into the generated HTML, keeping static hosting simple. The Vite base path is configured for the GitHub Pages project site at `/RepoLens/`.

## Continuous integration and deployment

- **CI** runs on pushes and pull requests: `npm ci`, TypeScript validation, production build, and production smoke checks.
- **GitHub Pages deployment** runs on pushes to `main` and supports manual dispatch. It builds, validates, uploads the `dist/` artifact, and deploys it with the official Pages actions.
- Both workflows use Node.js 22 and the committed npm lockfile.

If deployment is blocked, verify **Settings → Pages → Build and deployment → Source → GitHub Actions**.

## Day 1 closeout

The SPA migration, project-site base path, app entry point, hash-based routes, shared app/theme shell, responsive navigation, loading/error states, README, ignore rules, CI, and automated Pages deployment are in place. See [the Day 1 checklist](docs/day-1-closeout.md) for the audited scope and the remaining manual browser verification.

## Contributing and issues

- [Report a bug or request a feature](https://github.com/ashutoshpalhare/RepoLens/issues)
- [Contributing guide](https://github.com/ashutoshpalhare/RepoLens/blob/main/CONTRIBUTING.md)

## Project status

The Vite SPA is the active application on `main`. CI and the GitHub Pages deployment workflow completed successfully on the migration/deployment baseline. Interactive browser verification must still be performed after deployment and whenever user-facing behavior changes.
