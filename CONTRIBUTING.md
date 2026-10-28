# Contributing to RepoLens

Thanks for taking the time to improve RepoLens.

## Before opening a change

1. Search existing issues and pull requests to avoid duplicating work.
2. Keep changes focused and explain the user-visible problem they solve.
3. Do not commit GitHub tokens, secrets, local environment files, build output, or private repository contents.
4. Preserve the client-side architecture: repository requests should go directly from the browser to GitHub's public API and raw-content hosts.

## Local setup

Requirements: Node.js 22 and npm 10 or newer.

```bash
npm ci
npm run dev
```

## Validate changes

Run the checks that match your change before opening a pull request:

```bash
npm run typecheck
npm run build
npm run smoke
```

For UI changes, also test the home page, About page, repository workspace, a selected source file, keyboard navigation, theme settings, and a narrow viewport in a real browser.

## Pull requests

- Use a clear, action-oriented title.
- Describe the problem, solution, and any behavior changes.
- Link related issues.
- Include screenshots for meaningful visual changes.
- Report checks that you actually ran; do not claim manual browser checks unless they were performed.
