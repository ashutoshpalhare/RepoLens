import { extOf } from "@/lib/github";
import { packageName, parseSource } from "@/lib/parse";
import type {
  DependencyGraph,
  FileNode,
  LanguageStat,
  ModuleNode,
  ParsedFile,
  RepoInsights,
  SymbolDef,
  TreeEntry,
} from "@/types/repo";

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript (JSX)",
  js: "JavaScript",
  jsx: "JavaScript (JSX)",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  swift: "Swift",
  c: "C",
  h: "C Header",
  cpp: "C++",
  cs: "C#",
  php: "PHP",
  sh: "Shell",
  css: "CSS",
  scss: "Sass",
  html: "HTML",
  json: "JSON",
  yml: "YAML",
  yaml: "YAML",
  toml: "TOML",
  md: "Markdown",
  mdx: "MDX",
  sql: "SQL",
  svelte: "Svelte",
  vue: "Vue",
};

export function languageLabel(ext: string) {
  return LANG_LABELS[ext] ?? (ext ? ext.toUpperCase() : "No extension");
}

/** Build a nested file tree from the flat GitHub tree response. */
export function buildFileTree(entries: TreeEntry[]): FileNode[] {
  const root: FileNode = { name: "", path: "", type: "dir", children: [] };
  const dirs = new Map<string, FileNode>([["", root]]);

  const ensureDir = (path: string): FileNode => {
    const existing = dirs.get(path);
    if (existing) return existing;
    const idx = path.lastIndexOf("/");
    const parent = ensureDir(idx === -1 ? "" : path.slice(0, idx));
    const node: FileNode = { name: path.slice(idx + 1), path, type: "dir", children: [] };
    parent.children!.push(node);
    dirs.set(path, node);
    return node;
  };

  for (const entry of entries) {
    if (entry.type === "tree") {
      ensureDir(entry.path);
    } else if (entry.type === "blob") {
      const idx = entry.path.lastIndexOf("/");
      const parent = ensureDir(idx === -1 ? "" : entry.path.slice(0, idx));
      parent.children!.push({
        name: entry.path.slice(idx + 1),
        path: entry.path,
        type: "file",
        size: entry.size ?? 0,
      });
    }
  }

  const sort = (nodes: FileNode[]): FileNode[] => {
    nodes.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1,
    );
    for (const node of nodes) if (node.children) sort(node.children);
    return nodes;
  };

  return sort(root.children ?? []);
}

const CONFIG_FILES = [
  "package.json","tsconfig.json","vite.config.ts","next.config.js","Dockerfile","docker-compose.yml",
  "Cargo.toml","go.mod","requirements.txt","pyproject.toml","Gemfile","Makefile","pnpm-lock.yaml",
  ".eslintrc.json","eslint.config.js","tailwind.config.ts",
];

const DIR_ROLES: Record<string, string> = {
  src: "Application source",
  app: "Application source",
  lib: "Shared library code",
  libs: "Shared library code",
  packages: "Monorepo packages",
  components: "UI components",
  pages: "Routed pages",
  routes: "Routing",
  hooks: "React hooks",
  utils: "Utilities",
  types: "Type definitions",
  api: "API layer",
  server: "Server code",
  public: "Static assets",
  assets: "Static assets",
  static: "Static assets",
  test: "Tests",
  tests: "Tests",
  __tests__: "Tests",
  spec: "Tests",
  e2e: "End-to-end tests",
  docs: "Documentation",
  doc: "Documentation",
  examples: "Examples",
  scripts: "Build & tooling scripts",
  config: "Configuration",
  styles: "Styling",
  migrations: "Database migrations",
  ".github": "CI / automation",
};

export function computeInsights(entries: TreeEntry[]): RepoInsights {
  const files = entries.filter((e) => e.type === "blob");
  const folders = entries.filter((e) => e.type === "tree");

  const byExt = new Map<string, LanguageStat>();
  let totalBytes = 0;

  for (const file of files) {
    const size = file.size ?? 0;
    totalBytes += size;
    const ext = extOf(file.path);
    const stat = byExt.get(ext) ?? { ext, label: languageLabel(ext), files: 0, bytes: 0 };
    stat.files += 1;
    stat.bytes += size;
    byExt.set(ext, stat);
  }

  const topLevelCounts = new Map<string, number>();
  const dirCounts = new Map<string, number>();
  for (const file of files) {
    const seg = file.path.includes("/") ? file.path.split("/")[0]! : "(root)";
    topLevelCounts.set(seg, (topLevelCounts.get(seg) ?? 0) + 1);
    const segments = file.path.split("/").slice(0, -1);
    for (let i = 0; i < Math.min(segments.length, 3); i++) {
      const dir = segments.slice(0, i + 1).join("/");
      dirCounts.set(dir, (dirCounts.get(dir) ?? 0) + 1);
    }
  }

  const notableDirs = [...dirCounts.entries()]
    .map(([path, count]) => ({
      path,
      files: count,
      role: DIR_ROLES[path.split("/").pop() ?? ""] ?? "",
    }))
    .filter((d) => d.role)
    .sort((a, b) => b.files - a.files)
    .slice(0, 10);

  return {
    totalFiles: files.length,
    totalFolders: folders.length,
    totalBytes,
    languages: [...byExt.values()].sort((a, b) => b.files - a.files),
    largestFiles: files
      .map((f) => ({ path: f.path, size: f.size ?? 0 }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 8),
    topLevel: [...topLevelCounts.entries()]
      .map(([path, count]) => ({ path, files: count }))
      .sort((a, b) => b.files - a.files)
      .slice(0, 10),
    configFiles: files
      .map((f) => f.path)
      .filter((p) => CONFIG_FILES.includes(p.split("/").pop() ?? "")),
    notableDirs,
  };
}

const SOURCE_EXT = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "svelte", "vue"]);

export interface AnalyzableFile {
  path: string;
  content: string;
}

const ENTRY_NAMES = new Set([
  "main.ts","main.tsx","main.js","main.jsx","index.ts","index.tsx","index.js","index.jsx",
  "app.ts","app.tsx","app.js","app.jsx","server.ts","server.js","cli.ts","cli.js",
  "entry-client.tsx","entry-server.tsx","router.tsx",
]);

function looksLikeEntry(path: string) {
  const name = path.split("/").pop() ?? "";
  const depth = path.split("/").length;
  if (!ENTRY_NAMES.has(name)) return false;
  return depth <= 3 || path.startsWith("src/");
}

/** Detect the plausible alias roots present in the repository. */
function detectAliasRoots(paths: string[]) {
  const roots = new Set<string>();
  for (const candidate of ["src", "app", "lib", "source"]) {
    if (paths.some((p) => p.startsWith(`${candidate}/`))) roots.add(candidate);
  }
  roots.add("");
  return [...roots];
}

/** Tarjan-free simple cycle detection over a small module graph. */
function findCycles(adj: Map<string, string[]>, limit = 12) {
  const cycles: string[][] = [];
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const seen = new Set<string>();

  const visit = (node: string) => {
    if (cycles.length >= limit) return;
    state.set(node, 1);
    stack.push(node);
    for (const next of adj.get(node) ?? []) {
      const s = state.get(next) ?? 0;
      if (s === 1) {
        const start = stack.indexOf(next);
        if (start !== -1) {
          const cycle = stack.slice(start);
          const key = [...cycle].sort().join("|");
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cycle);
          }
        }
      } else if (s === 0) {
        visit(next);
      }
      if (cycles.length >= limit) break;
    }
    stack.pop();
    state.set(node, 2);
  };

  for (const node of adj.keys()) if ((state.get(node) ?? 0) === 0) visit(node);
  return cycles;
}

/**
 * Build the dependency graph from parsed sources: internal file-to-file edges,
 * external package usage, entry points, orphans and circular dependencies.
 */
export function buildDependencyGraph(
  allPaths: string[],
  scanned: AnalyzableFile[],
  skipped: number,
  sizes: Map<string, number> = new Map(),
): DependencyGraph {
  const fileSet = new Set(allPaths);
  const roots = detectAliasRoots(allPaths);

  const parsed: ParsedFile[] = scanned.map((f) => parseSource(f.path, f.content, fileSet, roots));
  const scannedSet = new Set(parsed.map((p) => p.path));

  const edges: DependencyGraph["edges"] = [];
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  const externals = new Map<string, Set<string>>();
  const packages = new Map<string, number>();
  const symbols: SymbolDef[] = [];

  const add = (map: Map<string, Set<string>>, key: string, value: string) => {
    const set = map.get(key) ?? new Set<string>();
    set.add(value);
    map.set(key, set);
  };

  for (const file of parsed) {
    symbols.push(...file.symbols);
    for (const imp of file.imports) {
      if (imp.kind === "package") {
        const name = packageName(imp.spec);
        if (!name.startsWith("node:")) {
          packages.set(name, (packages.get(name) ?? 0) + 1);
          add(externals, file.path, name);
        }
        continue;
      }
      if (!imp.resolved || imp.resolved === file.path) continue;
      add(outgoing, file.path, imp.resolved);
      add(incoming, imp.resolved, file.path);
    }
  }

  for (const [from, targets] of outgoing) {
    for (const to of targets) edges.push({ from, to });
  }

  const adj = new Map<string, string[]>();
  for (const [from, targets] of outgoing) adj.set(from, [...targets]);
  const cycles = findCycles(adj);
  const inCycle = new Set(cycles.flat());

  const involved = new Set<string>([...outgoing.keys(), ...incoming.keys()]);
  for (const p of parsed) involved.add(p.path);

  const entryPoints = [...involved]
    .filter(
      (path) =>
        looksLikeEntry(path) ||
        ((incoming.get(path)?.size ?? 0) === 0 && (outgoing.get(path)?.size ?? 0) > 0),
    )
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  const entrySet = new Set(entryPoints);

  const orphans = [...involved]
    .filter(
      (path) =>
        scannedSet.has(path) &&
        (incoming.get(path)?.size ?? 0) === 0 &&
        (outgoing.get(path)?.size ?? 0) === 0,
    )
    .sort();

  const byPath = new Map(parsed.map((p) => [p.path, p]));

  const modules: ModuleNode[] = [...involved].map((path) => {
    const segs = path.split("/");
    const info = byPath.get(path);
    return {
      path,
      label: segs.slice(-2).join("/"),
      group: segs.length > 1 ? segs.slice(0, -1).join("/") : "(root)",
      imports: outgoing.get(path)?.size ?? 0,
      importedBy: incoming.get(path)?.size ?? 0,
      importsList: [...(outgoing.get(path) ?? [])].sort(),
      importedByList: [...(incoming.get(path) ?? [])].sort(),
      externals: [...(externals.get(path) ?? [])].sort(),
      exports: info?.exports ?? [],
      loc: info?.loc ?? 0,
      size: sizes.get(path) ?? 0,
      isEntry: entrySet.has(path),
      isOrphan: orphans.includes(path),
      inCycle: inCycle.has(path),
    };
  });

  modules.sort(
    (a, b) => b.importedBy + b.imports - (a.importedBy + a.imports) || a.path.localeCompare(b.path),
  );

  return {
    modules,
    edges,
    scanned: parsed.length,
    skipped,
    cycles,
    orphans,
    entryPoints: entryPoints.slice(0, 12),
    symbols,
    externalPackages: [...packages.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24),
    totalInternalEdges: edges.length,
    avgFanOut: parsed.length ? Math.round((edges.length / parsed.length) * 10) / 10 : 0,
  };
}

export function pickSourceFilesForAnalysis(entries: TreeEntry[], limit = 140) {
  return entries
    .filter(
      (e) =>
        e.type === "blob" &&
        SOURCE_EXT.has(extOf(e.path)) &&
        (e.size ?? 0) < 160_000 &&
        !/(^|\/)(node_modules|dist|build|vendor|coverage|\.next|out)\//.test(e.path) &&
        !/\.(test|spec|d)\.[tj]sx?$/.test(e.path),
    )
    .sort((a, b) => a.path.length - b.path.length)
    .slice(0, limit);
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
