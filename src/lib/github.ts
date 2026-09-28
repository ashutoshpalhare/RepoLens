import { GitHubError, type RepoMeta, type RepoRef, type TreeEntry } from "@/types/repo";

const API = "https://api.github.com";

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

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
  } catch {
    throw new GitHubError("Network request failed. Check your connection.", "network");
  }

  if (res.ok) return (await res.json()) as T;

  if (res.status === 404) {
    throw new GitHubError("Repository not found. It may be private or misspelled.", "not_found", 404);
  }
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("x-ratelimit-reset");
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0" || res.status === 429) {
      const when = reset ? new Date(Number(reset) * 1000) : null;
      throw new GitHubError(
        `GitHub API rate limit reached${when ? `. Try again after ${when.toLocaleTimeString()}` : ""}.`,
        "rate_limit",
        res.status,
      );
    }
    throw new GitHubError("Access to this repository is forbidden.", "unknown", res.status);
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

/** Fetch raw text content for a blob. */
export async function fetchFileContent(ref: RepoRef, branch: string, path: string) {
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
  return res.text();
}
