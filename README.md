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
npm run preview
```

The production build uses `vite-plugin-singlefile` to inline the JavaScript and CSS into the generated HTML, keeping static hosting simple. The Vite base path is configured for the GitHub Pages project site at `/RepoLens/`.

## GitHub Pages

The site is intended for GitHub Pages. Hash-based client-side routing avoids the need for server-side route rewrites. The CI workflow checks dependency installation, TypeScript and the production build. Deployment workflow configuration should be validated against the repository's active default-branch workflow before merging.

## Project status

This branch contains the Opus V3 SPA migration candidate. Build and typecheck results must be taken from a successful CI run; they are not assumed from source inspection alone.
