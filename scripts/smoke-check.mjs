import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const read = (path) => readFile(resolve(process.cwd(), path), "utf8");
const [html, packageJsonText, viteConfig, router, githubClient, parserSource, homePage, workspacePage, fileExplorer] = await Promise.all([
  read("dist/index.html"),
  read("package.json"),
  read("vite.config.ts"),
  read("src/router.tsx"),
  read("src/lib/github.ts"),
  read("src/lib/parse.ts"),
  read("src/routes/index.tsx"),
  read("src/routes/r.$owner.$repo.tsx"),
  read("src/components/repolens/FileExplorer.tsx"),
]);
const pkg = JSON.parse(packageJsonText);
const transpiledParser = ts.transpileModule(parserSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});
const parserUrl = `data:text/javascript;base64,${Buffer.from(transpiledParser.outputText).toString("base64")}`;
const { parseGitHubInput } = await import(parserUrl);

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
  ["workspace routes validate the optional ref search parameter", () => assert.equal((router.match(/validateSearch:\s*validateWorkspaceSearch/g) ?? []).length, 2)],
  ["home flow preserves the selected ref from GitHub URLs", () => {
    assert.match(homePage, /search:\s*parsed\.ref\s*\?\s*\{\s*ref:\s*parsed\.ref\s*\}\s*:\s*\{\s*\}/);
  }],
  ["workspace tree queries use the selected ref", () => assert.match(workspacePage, /queryKey:\s*\[\s*"repo-tree",\s*owner,\s*repo,\s*ref\s*\]/)],
  ["directory deep links are not fetched as source files", () => assert.match(workspacePage, /selectedFilePath\s*=\s*selectedItem\?\.type\s*===\s*"blob"\s*\?\s*selectedPath\s*:\s*null/)],
  ["file explorer expands ancestors for deep links", () => assert.match(fileExplorer, /selectedPath\.startsWith\(`\$\{node\.path\}\/`\)/)],
  ["directory permalinks use GitHub tree URLs", () => assert.match(githubClient, /type\s*===\s*"tree"\s*\|\|\s*type\s*===\s*"submodule"\s*\?\s*"tree"/)],
  ["home, about, and repository routes are registered", () => {
    assert.match(router, /path:\s*["']\/["']/);
    assert.match(router, /path:\s*["']\/about["']/);
    assert.match(router, /path:\s*["']\/r\/\$owner\/\$repo["']/);
  }],
  ["GitHub API requests use the official API host", () => assert.match(githubClient, /https:\/\/api\.github\.com/)],
  ["raw file requests use the official raw GitHub host", () => assert.match(githubClient, /https:\/\/raw\.githubusercontent\.com/)],
  ["parses owner/repo shorthand", () => assert.deepEqual(parseGitHubInput("facebook/react"), { owner: "facebook", repo: "react", kind: "repo" })],
  ["parses a GitHub tree URL and path", () => assert.deepEqual(parseGitHubInput("https://github.com/facebook/react/tree/main/packages/react"), { owner: "facebook", repo: "react", kind: "tree", ref: "main", path: "packages/react" })],
  ["parses a GitHub blob URL and path", () => assert.deepEqual(parseGitHubInput("https://github.com/facebook/react/blob/main/packages/react/index.js"), { owner: "facebook", repo: "react", kind: "blob", ref: "main", path: "packages/react/index.js" })],
  ["strips the .git suffix", () => assert.deepEqual(parseGitHubInput("facebook/react.git"), { owner: "facebook", repo: "react", kind: "repo" })],
  ["rejects a non-GitHub hostname", () => assert.equal(parseGitHubInput("https://example.com/facebook/react"), null)],
  ["rejects malformed percent-encoding without throwing", () => assert.equal(parseGitHubInput("facebook/react/tree/%E0%A4%A"), null)],
  ["rejects empty input", () => assert.equal(parseGitHubInput("   "), null)],
];

let failed = 0;
for (const [label, run] of checks) {
  try {
    await run();
    console.log(`PASS  ${label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${label}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

console.log(`\nRepoLens production smoke checks: ${checks.length - failed}/${checks.length} passed.`);
if (failed > 0) process.exitCode = 1;
