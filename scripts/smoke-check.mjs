import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const read = (path) => readFile(resolve(process.cwd(), path), "utf8");
const [html, packageJsonText, viteConfig, router, githubClient, parserSource, homePage, workspacePage, fileExplorer, codeViewer, analysisSource, architectureView, insightsPanel] = await Promise.all([
  read("dist/index.html"),
  read("package.json"),
  read("vite.config.ts"),
  read("src/router.tsx"),
  read("src/lib/github.ts"),
  read("src/lib/parse.ts"),
  read("src/routes/index.tsx"),
  read("src/routes/r.$owner.$repo.tsx"),
  read("src/components/repolens/FileExplorer.tsx"),
  read("src/components/repolens/CodeViewer.tsx"),
  read("src/lib/analysis.ts"),
  read("src/components/repolens/ArchitectureView.tsx"),
  read("src/components/repolens/InsightsPanel.tsx"),
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
const transpiledGitHub = ts.transpileModule(githubClient, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});
const githubModuleUrl = `data:text/javascript;base64,${Buffer.from(transpiledGitHub.outputText).toString("base64")}`;
const { fetchRepoMeta, fetchFileContent, GitHubError } = await import(githubModuleUrl);

const analysisRuntimeSource = analysisSource.replace(
  'import { extOf, type TreeItem } from "./github";',
  'const extOf = (path) => { const name = path.split("/").pop() ?? ""; const dot = name.lastIndexOf("."); return dot > 0 ? name.slice(dot + 1).toLowerCase() : ""; };',
);
assert.notEqual(analysisRuntimeSource, analysisSource, "analysis smoke import shim must be applied");
const transpiledAnalysis = ts.transpileModule(analysisRuntimeSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});
const analysisModuleUrl = `data:text/javascript;base64,${Buffer.from(transpiledAnalysis.outputText).toString("base64")}`;
const { analyzeArchitecture, analyzeRepo } = await import(analysisModuleUrl);
const architectureFixture = [
  { path: "build/output.js", type: "blob", size: 120, sha: "1", mode: "100644" },
  { path: "src/contest.ts", type: "blob", size: 80, sha: "2", mode: "100644" },
  { path: "src/components/Button.tsx", type: "blob", size: 60, sha: "3", mode: "100644" },
  { path: "src/foo.test.ts", type: "blob", size: 40, sha: "4", mode: "100644" },
  { path: "tests/unit.spec.ts", type: "blob", size: 30, sha: "5", mode: "100644" },
];
const architectureFixtureReport = analyzeArchitecture(architectureFixture);
const architectureFixtureInsights = analyzeRepo(architectureFixture);
const healthFixture = [
  "README.md", "LICENSE", "package.json", "package-lock.json", "vite.config.ts",
  "tsconfig.json", ".github/workflows/ci.yml", "src/app.test.ts", "next.config.ts",
  "vitest.config.ts", "eslint.config.js", "Dockerfile",
].map((path, index) => ({ path, type: "blob", size: 40 + index, sha: String(index), mode: "100644" }));
const healthFixtureReport = analyzeRepo(healthFixture);
const partialHealthReport = analyzeRepo(healthFixture.slice(0, 3), { partial: true });
const mismatchedLockFixture = ["package.json", "go.mod", "Cargo.lock"].map((path, index) => ({
  path, type: "blob", size: 20, sha: String(index), mode: "100644",
}));
const extendedEcosystemFixture = ["requirements.txt", "uv.lock", "pubspec.yaml", "pubspec.lock", "Demo.csproj"].map((path, index) => ({
  path, type: "blob", size: 20, sha: String(index), mode: "100644",
}));
const mismatchedLockReport = analyzeRepo(mismatchedLockFixture);
const extendedEcosystemReport = analyzeRepo(extendedEcosystemFixture);
const crossDirectoryLockReport = analyzeRepo([
  { path: "app/package.json", type: "blob", size: 20, sha: "p", mode: "100644" },
  { path: "package-lock.json", type: "blob", size: 20, sha: "l", mode: "100644" },
]);

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
  ["only file blobs or unresolved paths in truncated trees are fetched as source files", () => assert.match(workspacePage, /selectedItem\?\.type\s*===\s*"blob"\s*\|\|/)],
  ["file explorer expands ancestors for deep links", () => assert.match(fileExplorer, /selectedPath\.startsWith\(`\$\{node\.path\}\/`\)/)],
  ["file explorer checks every folder before showing collapse-all", () => assert.match(fileExplorer, /allFolders\.every\(\(folder\) => expanded\.has\(folder\.path\)\)/)],
  ["filtered file matches include their parent directory context", () => assert.match(fileExplorer, /showPathContext/)],
  ["file explorer exposes the filtered match count", () => assert.match(fileExplorer, /matches\.length\.toLocaleString\(\)/)],
  ["code viewer resets its line window and scroll position when the file changes", () => assert.match(codeViewer, /setVisible\(CHUNK\)[\s\S]*scrollRef\.current\?\.scrollTo/)],
  ["code viewer supports copying the complete text file", () => assert.match(codeViewer, /File contents copied/)],
  ["code viewer identifies empty text files", () => assert.match(codeViewer, /Empty file/)],
  ["partial recursive trees still allow direct file deep links", () => assert.match(workspacePage, /treeQuery\.data\?\.truncated/)],
  ["architecture analysis retains representative source file paths for drill-down", () => {
    assert.match(analysisSource, /filePaths:\s*string\[\]/);
    assert.match(analysisSource, /layer\.filePaths\.length\s*<\s*8/);
  }],
  ["architecture heuristics do not mistake build or contest paths for UI or tests", () => {
    const ui = architectureFixtureReport.layers.find((layer) => layer.id === "ui");
    const tests = architectureFixtureReport.layers.find((layer) => layer.id === "tests");
    assert.equal(ui?.files, 1);
    assert.equal(tests?.files, 2);
    assert.equal(architectureFixtureInsights.testFiles, 2);
  }],
  ["architecture report links representative file paths to the correct layer", () => {
    const ui = architectureFixtureReport.layers.find((layer) => layer.id === "ui");
    assert.deepEqual(ui?.filePaths, ["src/components/Button.tsx"]);
  }],
  ["architecture test signals describe file ratios rather than claiming coverage", () => {
    assert.ok(architectureFixtureReport.signals.some((signal) => signal.label.startsWith("Test-file ratio:")));
    assert.ok(architectureFixtureReport.signals.every((signal) => !signal.label.includes("Test coverage signal")));
  }],
  ["detects dependency ecosystems from manifests and lockfiles", () => {
    assert.deepEqual(healthFixtureReport.ecosystems.map((ecosystem) => ecosystem.name), ["JavaScript / TypeScript"]);
    assert.deepEqual(healthFixtureReport.ecosystems[0].manifests, ["package.json"]);
    assert.deepEqual(healthFixtureReport.ecosystems[0].lockfiles, ["package-lock.json"]);
  }],
  ["does not count an unrelated ecosystem lockfile as reproducibility", () => {
    const dimension = mismatchedLockReport.health.dimensions.find((item) => item.id === "dependencies");
    assert.equal(dimension?.score, 10);
    assert.match(dimension?.detail ?? "", /without a recognized lockfile/);
  }],
  ["does not pair manifests with lockfiles from another directory", () => {
    const dimension = crossDirectoryLockReport.health.dimensions.find((item) => item.id === "dependencies");
    assert.equal(dimension?.score, 10);
    assert.match(dimension?.detail ?? "", /without a recognized lockfile/);
  }],
    ["recognizes Python, Dart, and .NET dependency manifests", () => {
    const names = extendedEcosystemReport.ecosystems.map((ecosystem) => ecosystem.name);
    assert.ok(names.includes("Python"));
    assert.ok(names.includes("Dart / Flutter"));
    assert.ok(names.includes(".NET"));
    assert.equal(extendedEcosystemReport.ecosystems.find((item) => item.name === "Python")?.lockfiles[0], "uv.lock");
    assert.equal(extendedEcosystemReport.ecosystems.find((item) => item.name === "Dart / Flutter")?.lockfiles[0], "pubspec.lock");
  }],
    ["detects frameworks and tooling from explicit config evidence", () => {
    const names = healthFixtureReport.stack.map((item) => item.name);
    assert.ok(names.includes("Next.js"));
    assert.ok(names.includes("Vite"));
    assert.ok(names.includes("Vitest"));
    assert.ok(names.includes("ESLint"));
    assert.ok(names.includes("Docker"));
    assert.ok(names.includes("GitHub Actions"));
  }],
  ["repository health score is deterministic and explainable", () => {
    assert.equal(healthFixtureReport.health.score, 100);
    assert.equal(healthFixtureReport.health.grade, "Strong");
    assert.equal(healthFixtureReport.health.dimensions.length, 5);
    assert.equal(healthFixtureReport.health.recommendations.length, 0);
  }],
  ["partial repository scans explicitly mark health as partial", () => {
    assert.equal(partialHealthReport.health.partial, true);
    assert.ok(partialHealthReport.health.recommendations.length > 0);
  }],
  ["health recommendations do not claim measured test coverage", () => {
    const sparse = analyzeRepo([{ path: "src/index.ts", type: "blob", size: 20, sha: "s", mode: "100644" }]);
    assert.ok(sparse.health.recommendations.some((item) => item.title === "Add a test suite"));
    assert.match(sparse.health.dimensions.find((item) => item.id === "tests")?.detail ?? "", /coverage are not measured/);
  }],
  ["insights panel displays health, stack detection, and partial-tree caveat", () => {
    assert.match(architectureView, /Architecture Blueprint/);
    assert.match(workspacePage, /partial: Boolean\(treeQuery\.data\?\.truncated\)/);
    assert.match(insightsPanel, /Repository health/);
    assert.match(insightsPanel, /Stack & ecosystem/);
    assert.match(insightsPanel, /Partial tree/);
  }],
    ["architecture view declares hooks before loading and cancelled early returns", () => {
    const hooks = architectureView.indexOf("useState<string | null>(null)");
    const loadingReturn = architectureView.indexOf("if (loading)");
    const cancelledReturn = architectureView.indexOf("if (cancelled)");
    assert.ok(hooks >= 0 && hooks < loadingReturn && hooks < cancelledReturn);
  }],
  ["architecture cards provide accessible direct file navigation", () => {
    assert.match(architectureView, /onClick=\{\(\) => onOpenFile\(path\)\}/);
    assert.match(workspacePage, /onOpenFile=\{openFile\}/);
  }],
  ["directory permalinks use GitHub tree URLs", () => assert.match(githubClient, /type\s*===\s*"tree"\s*\|\|\s*type\s*===\s*"submodule"\s*\?\s*"tree"/)],
  ["home, about, and repository routes are registered", () => {
    assert.match(router, /path:\s*["']\/["']/);
    assert.match(router, /path:\s*["']\/about["']/);
    assert.match(router, /path:\s*["']\/r\/\$owner\/\$repo["']/);
  }],
  ["GitHub API requests use the official API host", () => assert.match(githubClient, /https:\/\/api\.github\.com/)],
  ["raw file requests use the official raw GitHub host", () => assert.match(githubClient, /https:\/\/raw\.githubusercontent\.com/)],
  ["recognizes secondary rate limits without a zero primary budget", async () => {
    const originalFetch = globalThis.fetch;
    const startedAt = Date.now();
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "You have exceeded a secondary rate limit." }), {
      status: 403,
      headers: { "content-type": "application/json", "x-ratelimit-limit": "60", "x-ratelimit-remaining": "45", "x-ratelimit-reset": String(Math.floor((startedAt + 3_600_000) / 1000)) },
    });
    try {
      await assert.rejects(fetchRepoMeta("facebook", "react"), (error) => {
        assert.ok(error instanceof GitHubError);
        assert.equal(error.kind, "rate-limit");
        assert.ok(error.resetAt !== null && error.resetAt >= startedAt + 59_000 && error.resetAt <= startedAt + 61_000);
        return true;
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  }],
  ["honors Retry-After on a 403 response", async () => {
    const originalFetch = globalThis.fetch;
    const startedAt = Date.now();
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "Please retry later." }), {
      status: 403,
      headers: { "content-type": "application/json", "x-ratelimit-limit": "60", "x-ratelimit-remaining": "45", "retry-after": "3" },
    });
    try {
      await assert.rejects(fetchRepoMeta("facebook", "react"), (error) => {
        assert.ok(error instanceof GitHubError);
        assert.equal(error.kind, "rate-limit");
        assert.ok(error.resetAt !== null && error.resetAt >= startedAt + 2_500 && error.resetAt <= startedAt + 5_000);
        return true;
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  }],
  ["file content still loads when IndexedDB cache access throws", async () => {
    const originalFetch = globalThis.fetch;
    const indexedDBDescriptor = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
    globalThis.fetch = async () => new Response("export const value = 1;", { status: 200 });
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      writable: true,
      value: { open() { throw new Error("IndexedDB is blocked"); } },
    });
    try {
      const file = await fetchFileContent("demo", "repo", "main", "src/index.ts");
      assert.equal(file.text, "export const value = 1;");
      assert.equal(file.binary, false);
    } finally {
      globalThis.fetch = originalFetch;
      if (indexedDBDescriptor) Object.defineProperty(globalThis, "indexedDB", indexedDBDescriptor);
      else delete globalThis.indexedDB;
    }
  }],
  ["keeps ordinary forbidden responses classified as authorization errors", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "Resource not accessible by integration" }), {
      status: 403,
      headers: { "content-type": "application/json", "x-ratelimit-limit": "60", "x-ratelimit-remaining": "45" },
    });
    try {
      await assert.rejects(fetchRepoMeta("facebook", "react"), (error) => {
        assert.ok(error instanceof GitHubError);
        assert.equal(error.kind, "auth");
        return true;
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  }],
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
