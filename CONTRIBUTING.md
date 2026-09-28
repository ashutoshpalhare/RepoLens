# Contributing to RepoLens

Thanks for taking an interest in RepoLens. It is a small, dependency-light client-side app, and the
goal is to keep it that way.

## Getting started

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # production build
```

## Ground rules

- **No backend.** RepoLens talks directly to the public GitHub REST API. Please do not introduce
  servers, databases, accounts or paid services.
- **Keep API code out of components.** Network access belongs in `src/lib/github.ts`; derived data
  belongs in `src/lib/analysis.ts` and `src/lib/parse.ts`.
- **Use design tokens.** Colors, surfaces and radii come from `src/styles.css`. Never hardcode
  values like `text-white` or `bg-[#111]` in a component.
- **Accessibility matters.** Every interactive element needs a reachable label, a visible focus
  state and keyboard operation.
- **States are part of the feature.** Loading, empty, error and rate-limited states should be
  designed alongside the happy path.

## Project layout

```
src/
  components/repolens/   explorer, code viewer, insights, architecture, profile dock
  hooks/                 repository data queries and theme
  lib/                   GitHub client, analysis, parsing, background worker
  routes/                landing, about, workspace views
  types/                 shared TypeScript types
```

## Before opening a pull request

1. `npx tsgo --noEmit` (or `npm run build`) passes.
2. The change works in both dark and light themes.
3. The workspace still behaves on a narrow viewport.
4. Commits and the PR description explain the *why*, briefly.
