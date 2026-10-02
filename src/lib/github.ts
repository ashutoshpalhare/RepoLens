import { getCachedFileContent, setCachedFileContent } from "@/lib/file-cache";
import {
  GitHubError,
  type RateLimitState,
  type RepoMeta,
  type RepoRef,
  type TreeEntry,
} from "@/types/repo";

const API = "https://api.github.com";
const TOKEN_KEY = "repolens.token";

/* ------------------------------------------------------------------ token */

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
    // private / blocked storage
  }
}

export function hasStoredGitHubToken(): boolean {
  return Boolean(getStoredGitHubToken());
}

/* -------------------------------------------------------------- rate limit */

let rateLimitState: RateLimitState = {
  limit: null,
  remaining: null,
  resetAt: null,
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

function captureRateLimit(headers: Headers) {
  const limit = numberHeader(headers, "x-ratelimit-limit");
  const remaining = numberHeader(headers, "x-ratelimit-remaining");
  const resetSeconds = numberHeader(headers, "x-ratelimit-reset");
  if (limit === null && remaining === null && resetSeconds === null) return;

  rateLimitState = {
    limit,
    remaining,
    resetAt: resetSeconds === null ? null : resetSeconds * 1000,
    updatedAt: Date.now(),
  };
  rateLimitListeners.forEach((listener) => listener());
}

/* ----------------------------------------------------------------- helpers */

/** Parse an owner/repo pair from a GitHub URL, or a bare "owner/repo" string. */
export function parseRepoInput(input: string): RepoRef | null {
  const value = input.trim();
  if (!value) return null;

  const cleaned = value
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^\/+/, "");

  const parts = cleaned.split(/[/#?]/).filter(Boolean);
  const owner = parts[0];
  const repo = parts[1];
  const valid = (s?: string) => !!s && /^[A-Za-z0-9._-]+$/.test(s);
  if (!valid(owner) || !valid(repo)) return null;
  return { owner: owner as string, repo: repo as string };
}

function authHeaders(): HeadersInit {
  const token = getStoredGitHubToken();
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { headers: authHeaders() });
  } catch {
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    throw new GitHubError(
      offline
        ? "You appear offline. Reconnect, then retry."
        : "Network request failed. Check your connection.",
      offline ? "offline" : "network",
    );
  }

  captureRateLimit(res.headers);

  if (res.ok) return (await res.json()) as T;

  if (res.status === 401) {
    throw new GitHubError(
      "The saved GitHub token was rejected. Replace or remove it in Settings.",
      "auth",
      401,
    );
  }

  if (res.status === 404) {
    throw new GitHubError(
      "Repository not found. It may be private, misspelled, or need a token.",
      "not_found",
      404,
    );
  }

  if (res.status === 403 || res.status === 429) {
    const remaining = numberHeader(res.headers, "x-ratelimit-remaining");
    const resetSeconds = numberHeader(res.headers, "x-ratelimit-reset");
    const resetAt = resetSeconds === null ? null : resetSeconds * 1000;
    if (remaining === 0 || res.status === 429) {
      const when = resetAt ? new Date(resetAt).toLocaleTimeString() : null;
      throw new GitHubError(
        `GitHub API rate limit reached${when ? `. Try again after ${when}` : ""}. Add a token in Settings to raise the limit.`,
        "rate_limit",
        res.status,
        { resetAt, remaining },
      );
    }
    throw new GitHubError(
      "Access to this repository is forbidden. If it is private, add a token with access.",
      "auth",
      res.status,
      { resetAt, remaining },
    );
  }

  if (res.status === 409) {
    throw new GitHubError("This repository is empty — there are no files to explore.", "empty", 409);
  }

  throw new GitHubError(`GitHub API error (${res.status}).`, "unknown", res.status);
}

export function fetchRepoMeta({ owner, repo }: RepoRef) {
  return request<RepoMeta>(`/repos/${owner}/${repo}`);
}

export async function fetchRepoTree(ref: RepoRef, branch: string) {
  const data = await request<{ tree: TreeEntry[]; truncated: boolean }>(
    `/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  if (!data.tree?.length) {
    throw new GitHubError("This repository is empty — there are no files to explore.", "empty");
  }
  return data;
}

export const MAX_FILE_BYTES = 400_000;

const BINARY_EXT = new Set([
  "png","jpg","jpeg","gif","webp","avif","ico","bmp","tiff","pdf","zip","gz","tar","rar","7z",
  "mp3","mp4","mov","avi","webm","wav","ogg","flac","woff","woff2","ttf","otf","eot","exe","dll",
  "so","dylib","class","jar","wasm","bin","dat","db","sqlite","psd","ai","sketch","lock",
]);

export function extOf(path: string) {
  const name = path.split("/").pop() ?? "";
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export function isBinaryPath(path: string) {
  return BINARY_EXT.has(extOf(path));
}

/** True for git symlink (120000) or submodule (160000) tree modes. */
export function isSpecialTreeMode(mode?: string) {
  return mode === "120000" || mode === "160000";
}

/** Fetch raw text content for a blob. */
/** Fetch raw text content for a blob (IndexedDB cache when available). */
export async function fetchFileContent(ref: RepoRef, branch: string, path: string) {
  const cached = await getCachedFileContent(ref.owner, ref.repo, branch, path);
  if (cached !== null) return cached;

  const url = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${encodeURIComponent(branch)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new GitHubError("Could not download this file.", "network");
  }
  if (res.status === 404) throw new GitHubError("File not found on this branch.", "not_found", 404);
  if (!res.ok) throw new GitHubError(`Could not load file (${res.status}).`, "unknown", res.status);
  const text = await res.text();
  void setCachedFileContent(ref.owner, ref.repo, branch, path, text);
  return text;
}

export { clearFileContentCache } from "@/lib/file-cache";


/* ---------------------------------------------------------- open-in helpers */

export function repoUrl(owner: string, repo: string) {
  return `https://github.com/${owner}/${repo}`;
}

export function fileUrl(owner: string, repo: string, branch: string, path: string) {
  return `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(branch)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function github1sUrl(owner: string, repo: string) {
  return `https://github1s.com/${owner}/${repo}`;
}

export function githubDevUrl(owner: string, repo: string) {
  return `https://github.dev/${owner}/${repo}`;
}

export function vscodeCloneUrl(owner: string, repo: string) {
  return `vscode://vscode.git/clone?url=https://github.com/${owner}/${repo}.git`;
}
