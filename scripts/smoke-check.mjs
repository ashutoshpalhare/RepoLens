import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const read = (path) => readFile(resolve(process.cwd(), path), "utf8");
const [html, packageJsonText, viteConfig, router, githubClient] = await Promise.all([
  read("dist/index.html"),
  read("package.json"),
  read("vite.config.ts"),
  read("src/router.tsx"),
  read("src/lib/github.ts"),
]);
const pkg = JSON.parse(packageJsonText);

const checks = [
  ["package identity is RepoLens", () => assert.equal(pkg.name, "repolens")],
  ["production build has a document title", () => assert.match(html, /<title>[^<]*RepoLens[^<]*<\/title>/i)],
  ["production build includes the app mount point", () => assert.match(html, /<div id="root"><\/div>/i)],
  ["production build includes a description meta tag", () => assert.match(html, /<meta\s+name="description"/i)],
  ["production HTML is complete", () => {
    assert.match(html, /<head[\s>]/i);
    assert.match(html, /<\/head>/i);
    assert.match(html, /<body[\s>]/i);
    assert.match(html, /<\/body>/i);
    assert.match(html, /<\/html>/i);
  }],
  ["single-file build has inline CSS", () => assert.match(html, /<style[\s>]/i)],
  ["single-file build does not depend on an external app script", () => assert.doesNotMatch(html, /<script\b[^>]*\bsrc=/i)],
  ["production markup has no external Vite asset references", () => assert.doesNotMatch(html, /<(?:script|link)\b[^>]*(?:src|href)=["'][^"']*\/(?:src\/main\.tsx|assets\/)/i)],
  ["GitHub Pages project base is configured", () => assert.match(viteConfig, /base:\s*["']\/RepoLens\/["']/)],
  ["static hosting uses hash-based routing", () => assert.match(router, /createHashHistory\(\)/)],
  ["home, about, and repository routes are registered", () => {
    assert.match(router, /path:\s*["']\/["']/);
    assert.match(router, /path:\s*["']\/about["']/);
    assert.match(router, /path:\s*["']\/r\/\$owner\/\$repo["']/);
  }],
  ["GitHub API requests use the official API host", () => assert.match(githubClient, /https:\/\/api\.github\.com/)],
  ["raw file requests use the official raw GitHub host", () => assert.match(githubClient, /https:\/\/raw\.githubusercontent\.com/)],
];

let failed = 0;
for (const [label, run] of checks) {
  try {
    run();
    console.log(`PASS  ${label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${label}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

console.log(`\nProduction smoke checks: ${checks.length - failed}/${checks.length} passed.`);
if (failed > 0) process.exitCode = 1;
