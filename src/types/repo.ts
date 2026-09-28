export interface RepoRef {
  owner: string;
  repo: string;
}

export interface RepoMeta {
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number; // KB
  language: string | null;
  license: { spdx_id?: string; name?: string } | null;
  pushed_at: string;
  owner: { login: string; avatar_url: string };
}

export interface TreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: FileNode[];
}

export interface LanguageStat {
  ext: string;
  label: string;
  files: number;
  bytes: number;
}

export interface RepoInsights {
  totalFiles: number;
  totalFolders: number;
  totalBytes: number;
  languages: LanguageStat[];
  largestFiles: { path: string; size: number }[];
  topLevel: { path: string; files: number }[];
  configFiles: string[];
  notableDirs: { path: string; files: number; role: string }[];
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export type SymbolKind =
  | "function"
  | "class"
  | "const"
  | "type"
  | "interface"
  | "enum"
  | "component";

export interface SymbolDef {
  name: string;
  kind: SymbolKind;
  path: string;
  line: number;
  exported: boolean;
}

export interface ImportRef {
  spec: string;
  resolved: string | null;
  kind: "relative" | "alias" | "package";
}

export interface ParsedFile {
  path: string;
  loc: number;
  imports: ImportRef[];
  exports: string[];
  symbols: SymbolDef[];
}

export interface ModuleNode {
  path: string;
  label: string;
  group: string;
  /** number of internal files this module imports */
  imports: number;
  /** number of internal files importing this module */
  importedBy: number;
  importsList: string[];
  importedByList: string[];
  externals: string[];
  exports: string[];
  loc: number;
  size: number;
  isEntry: boolean;
  isOrphan: boolean;
  inCycle: boolean;
}

export interface DependencyGraph {
  modules: ModuleNode[];
  edges: DependencyEdge[];
  scanned: number;
  skipped: number;
  cycles: string[][];
  orphans: string[];
  entryPoints: string[];
  symbols: SymbolDef[];
  externalPackages: { name: string; count: number }[];
  totalInternalEdges: number;
  avgFanOut: number;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public kind: "not_found" | "rate_limit" | "network" | "unknown" | "empty",
    public status?: number,
  ) {
    super(message);
  }
}
