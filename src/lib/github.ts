/**
 * All network access lives here — public GitHub REST API + raw.githubusercontent.
 * RepoLens is fully static: no backend, no auth required, nothing stored server side.
 */

const API_ROOT = "https://api.github.com";
const RAW_ROOT = "https://raw.githubusercontent.com";

export type GitHubErrorKind =
  | "aborted"
  | "auth"
  | "empty"
  | "network"
  | "not-found"
  | "offline"
  | "rate-limit"
  | "unknown";

export class GitHubError extends Error {
  status: number;
  kind: GitHubErrorKind;
  resetAt: number | null;
  remaining: number | null;

  constructor(
    message: string,
    status = 0,
    options: {
      kind?: GitHubErrorKind;
      resetAt?: number | null;
      remaining?: number | null;
    } = {},
  ) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.kind = options.kind ?? "unknown";
    this.resetAt = options.resetAt ?? null;
    this.remaining = options.remaining ?? null;
  }
}

export type RateLimitState = {
  limit: number | null;
  remaining: number | null;
  resetAt: number | null;
  resource: string | null;
  updatedAt: number | null;
};

let rateLimitState: RateLimitState = {
  limit: null,
  remaining: null,
  resetAt: null,
  resource: null,
  updatedAt: null,
};
const rateLimitListeners = new Set<() => void>();

export function getRateLimitSnapshot(): RateLimitState {
  return rateLimitState;
}

export function subscribeRateLimit(listener: () => void): () => void {
  rateLimitListeners.add(listener);
  return () => rateLimitListeners.delete(listener);
}

function numberHeader(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type RateLimitDetails = {
  limited: boolean;
  resetAt: number | null;
  remaining: number | null;
};

/** Detect both primary and secondary GitHub API limits from headers and error payloads. */
async function rateLimitDetails(response: Response): Promise<RateLimitDetails> {
  const remaining = numberHeader(response.headers, "x-ratelimit-remaining");
  const resetSeconds = numberHeader(response.headers, "x-ratelimit-reset");
  const retryAfterSeconds = numberHeader(response.headers, "retry-after");
  let secondaryLimit = false;

  if (response.status === 403 && retryAfterSeconds === null && remaining !== 0) {
    const body = (await response.clone().json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof body?.message === "string" ? body.message.toLowerCase() : "";
    secondaryLimit = message.includes("secondary rate limit") || message.includes("abuse detection");
  }

  const limited = response.status === 429 || remaining === 0 || retryAfterSeconds !== null || secondaryLimit;
  const resetAt = retryAfterSeconds !== null
    ? Date.now() + retryAfterSeconds * 1000
    : secondaryLimit
      ? Date.now() + 60_000
      : resetSeconds !== null
        ? resetSeconds * 1000
        : null;

  return { limited, resetAt, remaining };
}

function captureRateLimit(headers: Headers) {
  const limit = numberHeader(headers, "x-ratelimit-limit");
  const remaining = numberHeader(headers, "x-ratelimit-remaining");
  const resetSeconds = numberHeader(headers, "x-ratelimit-reset");
  if (limit === null && remaining === null && resetSeconds === null) return;

  rateLimitState = {
    limit,
    remaining,
    resetAt: resetSeconds === null ? null : resetSeconds * 1000,
    resource: headers.get("x-ratelimit-resource"),
    updatedAt: Date.now(),
  };
  rateLimitListeners.forEach((listener) => listener());
}

const TOKEN_KEY = "repolens.token";

export function getStoredGitHubToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredGitHubToken(token: string | null) {
  try {
    const normalized = token?.trim() ?? "";
    if (normalized) localStorage.setItem(TOKEN_KEY, normalized);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked in hardened/private browser modes.
  }
}

export function hasStoredGitHubToken(): boolean {
  return Boolean(getStoredGitHubToken());
}

export type RepoMeta = {
  owner: string;
  repo: string;
  description: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  pushedAt: string | null;
  homepage: string | null;
  topics: string[];
  avatarUrl: string | null;
  ref: string;
};

export type TreeItem = {
  path: string;
  type: "blob" | "tree" | "symlink" | "submodule";
  size: number;
  sha: string;
  mode: string;
};

export type FileContent = {
  path: string;
  text: string;
  size: number;
  /** bytes if we could not decode as text */
  binary: boolean;
  truncated: boolean;
  oversized: boolean;
};

/** Files we never try to render. */
const BINARY_EXT = new Set([
  "png","jpg","jpeg","gif","webp","avif","bmp","ico","icns","tiff","pdf","zip","gz","tgz","bz2","xz","7z","rar","tar","jar","war","class","exe","dll","so","dylib","bin","dat","woff","woff2","ttf","otf","eot","mp3","mp4","mov","avi","mkv","webm","wav","flac","psd","ai","sketch","db","sqlite","pyc","wasm","node","lockb",
]);

export const MAX_RENDER_BYTES = 1_500_000; // ~1.5 MB of text is plenty for reading

export function extOf(path: string): string {
  const base = path.split("/").pop() ?? "";
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.slice(idx + 1).toLowerCase();
}

export function isBinaryPath(path: string): boolean {
  const ext = extOf(path);
  if (BINARY_EXT.has(ext)) return true;
  return /\.(min\.js|bundle\.js)$/i.test(path);
}

function headers(): HeadersInit {
  // The optional token is read only at request time and sent only to api.github.com.
  const token = getStoredGitHubToken();
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, {
      headers: headers(),
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GitHubError("Request cancelled.", 0, { kind: "aborted" });
    }
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    throw new GitHubError(
      offline
        ? "You appear to be offline. Reconnect, then retry."
        : "GitHub could not be reached. Check your connection and try again.",
      0,
      { kind: offline ? "offline" : "network" },
    );
  }

  captureRateLimit(res.headers);

  if (!res.ok) {
    if (res.status === 401) {
      throw new GitHubError(
        "The saved GitHub token was rejected. Replace or remove it in Settings.",
        401,
        { kind: "auth" },
      );
    }
    if (res.status === 403 || res.status === 429) {
      const details = await rateLimitDetails(res);
      if (details.limited) {
        throw new GitHubError(
          "GitHub is rate-limiting this request. Wait for the retry/reset time before trying again.",
          res.status,
          { kind: "rate-limit", resetAt: details.resetAt, remaining: details.remaining },
        );
      }
      throw new GitHubError(
        "GitHub refused this request. If you added a token, check that it is valid and has access to this repository.",
        res.status,
        { kind: "auth", resetAt: details.resetAt, remaining: details.remaining },
      );
    }
    if (res.status === 404) {
      throw new GitHubError(
        "Repository not found. Check the owner/name, or add a token in Settings if the repository is private.",
        404,
        { kind: "not-found" },
      );
    }
    if (res.status === 409) {
      throw new GitHubError(
        "This repository is empty — GitHub has no tree to browse yet.",
        409,
        { kind: "empty" },
      );
    }
    throw new GitHubError(`GitHub API error (${res.status}). Try again shortly.`, res.status);
  }
  return (await res.json()) as T;
}

/* ----------------------------------------------------------------- repo meta */

type RawRepo = {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id?: string; name?: string } | null;
  pushed_at: string | null;
  homepage: string | null;
  topics?: string[];
  owner: { avatar_url: string; login: string };
};

export async function fetchRepoMeta(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<RepoMeta> {
  const raw = await api<RawRepo>(`/repos/${owner}/${repo}`, signal);
  return {
    owner,
    repo: raw.name ?? repo,
    description: raw.description,
    defaultBranch: raw.default_branch ?? "main",
    stars: raw.stargazers_count ?? 0,
    forks: raw.forks_count ?? 0,
    watchers: raw.subscribers_count ?? 0,
    openIssues: raw.open_issues_count ?? 0,
    license: raw.license?.spdx_id && raw.license.spdx_id !== "NOASSERTION"
      ? raw.license.spdx_id
      : raw.license?.name ?? null,
    pushedAt: raw.pushed_at ?? null,
    homepage: raw.homepage ?? null,
    language: raw.language ?? null,
    topics: raw.topics ?? [],
    avatarUrl: raw.owner?.avatar_url ?? null,
    ref: raw.default_branch ?? "main",
  };
}

/* -------------------------------------------------------------------- tree */

type RawTreeEntry = {
  path: string;
  type: "blob" | "tree" | "commit";
  mode: string;
  size?: number;
  sha: string;
};

type RawTreeResponse = {
  sha: string;
  tree: RawTreeEntry[];
  truncated: boolean;
};

/**
 * Recursive git tree. Handles the 100k-entry / 7MB API truncation by
 * falling back to the contents API for the root when needed.
 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  ref: string,
  signal?: AbortSignal,
): Promise<{ items: TreeItem[]; truncated: boolean }> {
  const data = await api<RawTreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    signal,
  );

  const items: TreeItem[] = (data.tree ?? [])
    .filter((e) => e.type === "blob" || e.type === "tree" || e.type === "commit")
    .map((e) => ({
      path: e.path,
      type:
        e.mode === "120000"
          ? "symlink"
          : e.mode === "160000" || e.type === "commit"
            ? "submodule"
            : e.type,
      size: e.size ?? 0,
      sha: e.sha,
      mode: e.mode,
    }));

  return { items, truncated: Boolean(data.truncated) };
}

/* ------------------------------------------------------------------- files */

const FILE_CACHE_DB = "repolens-file-cache";
const FILE_CACHE_STORE = "files";
const FILE_CACHE_VERSION = 1;

type CachedFile = FileContent & { key: string; cachedAt: number };

export function clearFileContentCache(): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(FILE_CACHE_DB);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

function openFileCache(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise<IDBDatabase | null>((resolve) => {
    const request = indexedDB.open(FILE_CACHE_DB, FILE_CACHE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_CACHE_STORE)) {
        request.result.createObjectStore(FILE_CACHE_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function readCachedFile(key: string): Promise<FileContent | null> {
  const db = await openFileCache();
  if (!db) return null;
  return new Promise<FileContent | null>((resolve) => {
    const request = db.transaction(FILE_CACHE_STORE, "readonly").objectStore(FILE_CACHE_STORE).get(key);
    request.onsuccess = () => {
      const cached = request.result as CachedFile | undefined;
      // Revalidate after seven days; refs are part of the key so commit/branch changes separate naturally.
      resolve(cached && Date.now() - cached.cachedAt < 7 * 86_400_000 ? cached : null);
    };
    request.onerror = () => resolve(null);
  }).finally(() => db.close());
}

async function writeCachedFile(key: string, file: FileContent): Promise<void> {
  if (file.oversized) return;
  const db = await openFileCache();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(FILE_CACHE_STORE, "readwrite");
    transaction.objectStore(FILE_CACHE_STORE).put({ ...file, key, cachedAt: Date.now() });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });
  db.close();
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  ref: string,
  path: string,
  signal?: AbortSignal,
): Promise<FileContent> {
  const cacheKey = `${owner}/${repo}@${ref}:${path}`;
  const cached = await readCachedFile(cacheKey);
  if (cached) return cached;

  const url = `${RAW_ROOT}/${owner}/${repo}/${encodePathSegments(ref)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  let res: Response;
  try {
    const token = getStoredGitHubToken();
    if (token) {
      // The Contents API supports private repositories and returns raw bytes with this media type.
      const apiUrl = `${API_ROOT}/repos/${owner}/${repo}/contents/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}?ref=${encodeURIComponent(ref)}`;
      res = await fetch(apiUrl, {
        signal,
        headers: {
          ...headers(),
          Accept: "application/vnd.github.raw+json",
        },
      });
      captureRateLimit(res.headers);
    } else {
      res = await fetch(url, { signal });
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GitHubError("Request cancelled.", 0, { kind: "aborted" });
    }
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    throw new GitHubError(
      offline
        ? "You appear to be offline. Reconnect, then retry."
        : "Could not load this file from raw.githubusercontent.com.",
      0,
      { kind: offline ? "offline" : "network" },
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new GitHubError(
        "The saved GitHub token was rejected. Replace or remove it in Settings.",
        401,
        { kind: "auth" },
      );
    }
    if (res.status === 403 || res.status === 429) {
      const details = await rateLimitDetails(res);
      throw new GitHubError(
        details.limited
          ? "GitHub is rate-limiting this file request. Wait for the retry/reset time before trying again."
          : "GitHub refused this file request. Check the token in Settings.",
        res.status,
        {
          kind: details.limited ? "rate-limit" : "auth",
          resetAt: details.resetAt,
          remaining: details.remaining,
        },
      );
    }
    throw new GitHubError(
      res.status === 404
        ? "File not found on the selected branch."
        : `Could not load file (${res.status}).`,
      res.status,
    );
  }

  const contentLength = Number(res.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RENDER_BYTES) {
    return {
      path,
      text: "",
      size: contentLength,
      binary: false,
      truncated: false,
      oversized: true,
    };
  }

  const buf = await res.arrayBuffer();
  const bytes = buf.byteLength;

  if (isBinaryPath(path)) {
    const file = { path, text: "", size: bytes, binary: true, truncated: false, oversized: false };
    void writeCachedFile(cacheKey, file);
    return file;
  }

  // Very rough binary sniff: too many NUL bytes → treat as binary.
  const head = new Uint8Array(buf.slice(0, 2048));
  let nulls = 0;
  for (let i = 0; i < head.length; i += 1) if (head[i] === 0) nulls += 1;
  if (nulls > 2) {
    const file = { path, text: "", size: bytes, binary: true, truncated: false, oversized: false };
    void writeCachedFile(cacheKey, file);
    return file;
  }

  if (bytes > MAX_RENDER_BYTES) {
    return {
      path,
      text: "",
      size: bytes,
      binary: false,
      truncated: false,
      oversized: true,
    };
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);

  const file = { path, text, size: bytes, binary: false, truncated: false, oversized: false };
  void writeCachedFile(cacheKey, file);
  return file;
}

/* ------------------------------------------------------------------ readme */

export async function fetchReadmeText(
  owner: string,
  repo: string,
  ref: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const file = await fetchFileContent(
      owner,
      repo,
      ref,
      "README.md",
      signal,
    );
    return file.text || null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------- urls */

/** Encode each path segment, keeping "/" separators intact. */
export function encodePathSegments(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

const slug = (owner: string, repo: string) =>
  `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

export function repoUrl(owner: string, repo: string): string {
  return `https://github.com/${slug(owner, repo)}`;
}

export function fileUrl(
  owner: string,
  repo: string,
  ref: string,
  path: string,
): string {
  return `${repoUrl(owner, repo)}/blob/${encodePathSegments(ref)}/${encodePathSegments(path)}`;
}

export function treeEntryUrl(
  owner: string,
  repo: string,
  ref: string,
  path: string,
  type: TreeItem["type"],
): string {
  const kind = type === "tree" || type === "submodule" ? "tree" : "blob";
  return `${repoUrl(owner, repo)}/${kind}/${encodePathSegments(ref)}/${encodePathSegments(path)}`;
}

export function blameUrl(owner: string, repo: string, ref: string, path: string): string {
  return `${repoUrl(owner, repo)}/blame/${encodePathSegments(ref)}/${encodePathSegments(path)}`;
}

export function rawFileUrl(owner: string, repo: string, ref: string, path: string): string {
  return `${RAW_ROOT}/${slug(owner, repo)}/${encodePathSegments(ref)}/${encodePathSegments(path)}`;
}

export function compareUrl(owner: string, repo: string): string {
  return `${repoUrl(owner, repo)}/compare`;
}

export function github1sUrl(owner: string, repo: string): string {
  return `https://github1s.com/${slug(owner, repo)}`;
}

export function githubDevUrl(owner: string, repo: string): string {
  return `https://github.dev/${slug(owner, repo)}`;
}

export function vscodeCloneUrl(owner: string, repo: string): string {
  return `vscode://vscode.git/clone?url=${repoUrl(owner, repo)}.git`;
}

/* Explore tools — all accept a plain owner/repo deep link. */

export function gitDiagramUrl(owner: string, repo: string): string {
  return `https://gitdiagram.com/${slug(owner, repo)}`;
}

export function sourcegraphUrl(owner: string, repo: string): string {
  return `https://sourcegraph.com/github.com/${slug(owner, repo)}`;
}

export function grepAppUrl(owner: string, repo: string): string {
  return `https://grep.app/search?q=${encodeURIComponent(`repo:${owner}/${repo}`)}`;
}

/* AI-context tools — owner/repo deep links that produce LLM-friendly views. */

export function gitingestUrl(owner: string, repo: string): string {
  return `https://gitingest.com/${slug(owner, repo)}`;
}

export function uithubUrl(owner: string, repo: string): string {
  return `https://uithub.com/${slug(owner, repo)}`;
}

export function deepWikiUrl(owner: string, repo: string): string {
  return `https://deepwiki.com/${slug(owner, repo)}`;
}

export function gitReverseUrl(owner: string, repo: string): string {
  return `https://gitreverse.com/${slug(owner, repo)}`;
}

export function gitMcpUrl(owner: string, repo: string): string {
  return `https://gitmcp.io/${slug(owner, repo)}`;
}

export function gitPodcastUrl(owner: string, repo: string): string {
  return `https://gitpodcast.com/${slug(owner, repo)}`;
}
