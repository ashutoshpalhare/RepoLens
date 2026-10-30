/**
 * Repo analysis — everything here is pure and runs in the browser.
 */

import { extOf, type TreeItem } from "./github";

/* ------------------------------------------------------------------- tree */

export type TreeNode = {
  name: string;
  path: string;
  type: TreeItem["type"];
  size: number;
  sha: string;
  mode: string;
  children: TreeNode[];
};

export function buildTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", type: "tree", size: 0, sha: "", mode: "040000", children: [] };
  const dirs = new Map<string, TreeNode>([["", root]]);

  const ensureDir = (path: string): TreeNode => {
    const existing = dirs.get(path);
    if (existing) return existing;
    const segments = path.split("/");
    const name = segments[segments.length - 1];
    const parentPath = segments.slice(0, -1).join("/");
    const parent = ensureDir(parentPath);
    const node: TreeNode = { name, path, type: "tree", size: 0, sha: "", mode: "040000", children: [] };
    parent.children.push(node);
    dirs.set(path, node);
    return node;
  };

  for (const item of items) {
    if (item.type === "tree") {
      ensureDir(item.path);
      continue;
    }
    const segments = item.path.split("/");
    const parentPath = segments.slice(0, -1).join("/");
    const parent = ensureDir(parentPath);
    parent.children.push({
      name: segments[segments.length - 1],
      path: item.path,
      type: item.type,
      size: item.size ?? 0,
      sha: item.sha,
      mode: item.mode,
      children: [],
    });
  }

  const sortNode = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    node.children.forEach(sortNode);
    if (node.type === "tree") {
      node.size = node.children.reduce((sum, c) => sum + c.size, 0);
    }
  };
  sortNode(root);

  return root.children;
}

export type TreeFormatOptions = {
  /** depth of nested folders to include; Infinity = all */
  maxDepth?: number;
  /** only folders */
  foldersOnly?: boolean;
  /** label printed on the first line */
  rootName?: string;
};

/**
 * Renders an ASCII directory tree using ├── └── │ connectors.
 */
export function formatTreeAscii(
  nodes: TreeNode[],
  options: TreeFormatOptions = {},
): string {
  const { maxDepth = Infinity, foldersOnly = false, rootName } = options;
  const root = rootName ?? ".";
  const lines: string[] = [root];

  const walk = (children: TreeNode[], depth: number, prefix: string) => {
    const visible = children.filter((n) =>
      foldersOnly ? n.type === "tree" : true,
    );
    visible.forEach((node, index) => {
      const last = index === visible.length - 1;
      const branch = last ? "└── " : "├── ";
      lines.push(`${prefix}${branch}${node.name}${node.type === "tree" ? "/" : ""}`);
      if (node.type === "tree" && depth + 1 < maxDepth) {
        walk(node.children, depth + 1, prefix + (last ? "    " : "│   "));
      }
    });
  };

  walk(nodes, 0, "");
  return lines.join("\n");
}

export function flattenNodes(nodes: TreeNode[], depth = 1): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    out.push(node);
    if (node.type === "tree" && depth > 1) out.push(...flattenNodes(node.children, depth - 1));
  }
  return out;
}

export function findNodeByPath(nodes: TreeNode[], path: string): TreeNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (path.startsWith(`${node.path}/`)) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

/* -------------------------------------------------------------- languages */

export type LanguageStat = {
  name: string;
  bytes: number;
  share: number;
  files: number;
  color: string;
};

const LANG_COLORS: Record<string, string> = {
  typescript: "#3178c6",
  javascript: "#f1e05a",
  tsx: "#3178c6",
  jsx: "#f1e05a",
  python: "#3572A5",
  go: "#00ADD8",
  rust: "#dea584",
  java: "#b07219",
  kotlin: "#A97BFF",
  swift: "#F05138",
  ruby: "#701516",
  php: "#4F5D95",
  c: "#555555",
  cpp: "#f34b7d",
  "c#": "#178600",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  vue: "#41b883",
  svelte: "#ff3e00",
  shell: "#89e051",
  markdown: "#083fa1",
  json: "#cbcb41",
  yaml: "#cb171e",
  sql: "#e38c00",
  dart: "#00B4AB",
  lua: "#000080",
  elixir: "#6e4a7e",
  haskell: "#5e5086",
  jupyter: "#DA5B0B",
  dockerfile: "#384d54",
};

const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "tsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  rb: "ruby",
  php: "php",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "c#",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "css",
  vue: "vue",
  svelte: "svelte",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  md: "markdown",
  mdx: "markdown",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  toml: "yaml",
  sql: "sql",
  dart: "dart",
  lua: "lua",
  ex: "elixir",
  exs: "elixir",
  hs: "haskell",
  ipynb: "jupyter",
  graphql: "graphql",
  prisma: "prisma",
};

export function languageOf(path: string): string | null {
  const base = path.split("/").pop() ?? "";
  if (/^dockerfile$/i.test(base)) return "dockerfile";
  if (/^makefile$/i.test(base)) return "make";
  const ext = extOf(path);
  if (!ext) return null;
  return EXT_TO_LANG[ext] ?? null;
}

export function languageColor(lang: string): string {
  return LANG_COLORS[lang.toLowerCase()] ?? "#8b949e";
}

/* --------------------------------------------------------------- insights */

export type InsightStat = { label: string; value: string; hint?: string };

export type RepoInsights = {
  fileCount: number;
  dirCount: number;
  totalBytes: number;
  avgFileBytes: number;
  maxDepth: number;
  languages: LanguageStat[];
  largestFiles: TreeItem[];
  topDirs: { path: string; files: number; bytes: number }[];
  testFiles: number;
  configFiles: number;
  scriptFiles: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasCi: boolean;
  deps: { name: string; path: string; kind: string }[];
  entryPoints: string[];
};

const DEP_FILES: Record<string, string> = {
  "package.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "package-lock.json": "npm",
  "requirements.txt": "pip",
  "pyproject.toml": "pip",
  "Pipfile": "pip",
  "go.mod": "go modules",
  "go.sum": "go modules",
  "Cargo.toml": "cargo",
  "pom.xml": "maven",
  "build.gradle": "gradle",
  "build.gradle.kts": "gradle",
  "Gemfile": "bundler",
  "composer.json": "composer",
  "mix.exs": "mix",
  "nuget.config": "nuget",
  "deno.json": "deno",
  "bun.lockb": "bun",
};

const TEST_HINTS = /(^|[\/._-])(?:tests?|specs?|__tests__|__mocks__|e2e)(?=$|[\/._-])/i;

export function analyzeRepo(items: TreeItem[]): RepoInsights {
  const blobs = items.filter((i) => i.type === "blob");
  const dirs = items.filter((i) => i.type === "tree");

  const totalBytes = blobs.reduce((s, b) => s + (b.size ?? 0), 0);

  const langTotals = new Map<string, { bytes: number; files: number }>();
  for (const blob of blobs) {
    const lang = languageOf(blob.path);
    if (!lang) continue;
    const cur = langTotals.get(lang) ?? { bytes: 0, files: 0 };
    cur.bytes += blob.size ?? 0;
    cur.files += 1;
    langTotals.set(lang, cur);
  }

  const languages: LanguageStat[] = [...langTotals.entries()]
    .map(([name, v]) => ({
      name,
      bytes: v.bytes,
      files: v.files,
      share: totalBytes ? v.bytes / totalBytes : 0,
      color: languageColor(name),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);

  const largestFiles = [...blobs]
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, 8);

  const dirAgg = new Map<string, { files: number; bytes: number }>();
  let depthMax = 0;
  for (const blob of blobs) {
    const segments = blob.path.split("/");
    depthMax = Math.max(depthMax, segments.length);
    const top = segments.length > 1 ? segments[0] : "(root)";
    const cur = dirAgg.get(top) ?? { files: 0, bytes: 0 };
    cur.files += 1;
    cur.bytes += blob.size ?? 0;
    dirAgg.set(top, cur);
  }

  const topDirs = [...dirAgg.entries()]
    .map(([path, v]) => ({ path, ...v }))
    .sort((a, b) => b.files - a.files)
    .slice(0, 8);

  const deps: RepoInsights["deps"] = [];
  for (const item of items) {
    const base = item.path.split("/").pop() ?? "";
    const kind = DEP_FILES[base];
    if (kind && !item.path.includes("node_modules/")) {
      deps.push({ name: base, path: item.path, kind });
    }
  }

  const names = new Set(blobs.map((b) => b.path));

  return {
    fileCount: blobs.length,
    dirCount: dirs.length,
    totalBytes,
    avgFileBytes: blobs.length ? Math.round(totalBytes / blobs.length) : 0,
    maxDepth: depthMax,
    languages,
    largestFiles,
    topDirs,
    testFiles: blobs.filter((b) => TEST_HINTS.test(b.path)).length,
    configFiles: blobs.filter((b) => /^(config|settings|\.env|tsconfig|vite\.config|next\.config|tailwind\.config)/i.test(b.path.split("/").pop() ?? "")).length,
    scriptFiles: blobs.filter((b) => /^(scripts?|tools?)\//i.test(b.path)).length,
    hasReadme:
      names.has("README.md") || blobs.some((b) => /^readme/i.test(b.path.split("/").pop() ?? "")),
    hasLicense: names.has("LICENSE") || names.has("LICENSE.md") || names.has("LICENSE.txt"),
    hasCi: blobs.some((b) => b.path.startsWith(".github/workflows/")),
    deps,
    entryPoints: blobs
      .filter((b) =>
        /^(src\/)?(main|index|app|server|cli)\.(tsx?|jsx?|py|go|rs)$/.test(b.path),
      )
      .slice(0, 6)
      .map((b) => b.path),
  };
}

/* ----------------------------------------------------------- architecture */

export type ArchitectureLayer = {
  id: string;
  label: string;
  description: string;
  paths: string[];
  /** Representative source files for direct navigation from the architecture view. */
  filePaths: string[];
  files: number;
  bytes: number;
  share: number;
};

const LAYER_RULES: { id: string; label: string; description: string; test: RegExp }[] = [
  {
    id: "ui",
    label: "UI & components",
    description: "Presentational components, pages and layout markup.",
    test: /(^|[\/._-])(?:components?|ui|views?|pages?|screens?|layouts?)(?=$|[\/._-])|app\/templates/i,
  },
  {
    id: "client",
    label: "Client entry & app shell",
    description: "Bootstrap, routing and provider wiring.",
    test: /(main\.|app\.|index\.|router|routes|providers?|App\.tsx?$)/i,
  },
  {
    id: "state",
    label: "State & data layer",
    description: "Stores, hooks, queries and API clients.",
    test: /(hooks?|store|state|context|queries?|api|services?|repositories?|models?|data)/i,
  },
  {
    id: "core",
    label: "Core logic & utilities",
    description: "Framework-agnostic helpers, parsers and pure logic.",
    test: /(lib|utils?|helpers?|core|engine|domain|logic|parsers?|types?|shared)/i,
  },
  {
    id: "style",
    label: "Styling & assets",
    description: "Stylesheets, design tokens and static assets.",
    test: /(styles?|css|scss|assets?|public\/|fonts?|images?|icons?)/i,
  },
  {
    id: "tests",
    label: "Tests",
    description: "Unit, integration and end-to-end specs.",
    test: /(^|[\/._-])(?:tests?|specs?|__tests__|__mocks__|e2e)(?=$|[\/._-])/i,
  },
  {
    id: "infra",
    label: "Build, CI & config",
    description: "Tooling, pipelines, containers and deployment.",
    test: /(\.github|docker|config|webpack|vite|rollup|esbuild|tsconfig|babel|\.yml$|\.yaml$|Makefile|Dockerfile|scripts?)/i,
  },
  {
    id: "docs",
    label: "Docs",
    description: "Documentation and guides.",
    test: /(docs?|README|CHANGELOG|CONTRIBUTING|LICENSE|\.mdx?$)/i,
  },
];

export type ArchitectureReport = {
  layers: ArchitectureLayer[];
  totalFiles: number;
  totalBytes: number;
  unclassified: number;
  signals: { label: string; detail: string; tone: "ok" | "warn" | "info" }[];
  summary: string;
};

export function analyzeArchitecture(items: TreeItem[]): ArchitectureReport {
  const blobs = items.filter((i) => i.type === "blob");
  const totalFiles = blobs.length;
  const totalBytes = blobs.reduce((s, b) => s + (b.size ?? 0), 0);

  const layers: ArchitectureLayer[] = LAYER_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    description: rule.description,
    paths: [],
    filePaths: [],
    files: 0,
    bytes: 0,
    share: 0,
  }));

  let unclassified = 0;

  for (const blob of blobs) {
    const rule = LAYER_RULES.find((r) => r.test.test(blob.path));
    if (!rule) {
      unclassified += 1;
      continue;
    }
    const layer = layers.find((l) => l.id === rule.id)!;
    layer.files += 1;
    layer.bytes += blob.size ?? 0;
    if (layer.paths.length < 6) {
      layer.paths.push(blob.path.split("/").slice(0, 2).join("/") || "(root)");
    }
    if (layer.filePaths.length < 8) {
      layer.filePaths.push(blob.path);
    }
  }

  layers.forEach((layer) => {
    layer.share = totalFiles ? layer.files / totalFiles : 0;
    layer.paths = [...new Set(layer.paths)];
  });

  const present = layers.filter((l) => l.files > 0);
  const signals: ArchitectureReport["signals"] = [];

  if (blobs.length === 0) {
    signals.push({ label: "Empty repository", detail: "No files were returned by the GitHub API.", tone: "warn" });
  } else {
    signals.push({
      label: `${totalFiles.toLocaleString()} files indexed`,
      detail: `≈${formatBytes(totalBytes)} across ${new Set(blobs.map((b) => b.path.split("/")[0])).size} top-level entries.`,
      tone: "info",
    });
  }

  const testLayer = layers.find((l) => l.id === "tests")!;
  const testRatio = totalFiles ? testLayer.files / totalFiles : 0;
  signals.push({
    label: `Test-file ratio: ${(testRatio * 100).toFixed(1)}% of files`,
    detail:
      testRatio === 0
        ? "No test files were detected in the indexed tree. This is a structural signal, not measured test coverage."
        : testRatio < 0.1
          ? "A small share of indexed files look like tests. This is a structural signal, not measured test coverage."
          : "A larger share of indexed files look like tests; actual coverage still requires running a test suite.",
    tone: testRatio === 0 ? "warn" : testRatio < 0.1 ? "warn" : "ok",
  });

  const infra = layers.find((l) => l.id === "infra")!;
  signals.push({
    label: infra.files > 0 ? "CI / build tooling present" : "No build or CI config found",
    detail:
      infra.files > 0
        ? `${infra.files} config/build files — good reproducibility signals.`
        : "The repo relies on conventions outside version control.",
    tone: infra.files > 0 ? "ok" : "warn",
  });

  const coreLayer = layers.find((l) => l.id === "core")!;
  const uiLayer = layers.find((l) => l.id === "ui")!;
  if (coreLayer.files > 0 && uiLayer.files > 0) {
    signals.push({
      label: "Layered structure detected",
      detail: `UI (${uiLayer.files}) is separated from core logic (${coreLayer.files}) — easier to reuse.`,
      tone: "ok",
    });
  }

  const biggest = [...present].sort((a, b) => b.files - a.files)[0];
  const summary = biggest
    ? `Structure is dominated by ${biggest.label.toLowerCase()} (${biggest.files} files, ${(biggest.share * 100).toFixed(0)}% of the tree), followed by ${present
        .slice()
        .sort((a, b) => b.files - a.files)
        .slice(1, 3)
        .map((l) => l.label.toLowerCase())
        .join(" and ")}. ${unclassified} file${unclassified === 1 ? "" : "s"} did not match a known layer.`
    : "No structure could be derived from this repository.";

  return { layers: layers.filter((l) => l.files > 0), totalFiles, totalBytes, unclassified, signals, summary };
}

/**
 * Yields between chunks so large repository scans do not monopolize the main
 * thread. Abort is checked at every boundary and before the final summary.
 */
export async function analyzeArchitectureIncremental(
  items: TreeItem[],
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<ArchitectureReport> {
  const collected: TreeItem[] = [];
  const chunkSize = 750;
  onProgress(items.length ? 0 : 100);

  for (let index = 0; index < items.length; index += chunkSize) {
    if (signal.aborted) throw new DOMException("Architecture scan cancelled", "AbortError");
    collected.push(...items.slice(index, index + chunkSize));
    onProgress(Math.min(96, Math.round((collected.length / items.length) * 96)));
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  if (signal.aborted) throw new DOMException("Architecture scan cancelled", "AbortError");
  const report = analyzeArchitecture(collected);
  onProgress(100);
  return report;
}

/* ---------------------------------------------------------------- format */

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "unknown";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < 3_600_000) return "just now";
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}
