/**
 * GitHub URL / input parsing. Pure functions, no network.
 */

export type ParsedTarget = {
  owner: string;
  repo: string;
  /** branch / tag / commit sha, when the URL contained one */
  ref?: string;
  /** path inside the repo (no leading slash) */
  path?: string;
  /** what the URL pointed at */
  kind: "tree" | "blob" | "repo";
};

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?$/;
const REPO_RE = /^[A-Za-z0-9._-]+$/;

function cleanRepoName(repo: string): string {
  return repo.replace(/\.git$/i, "");
}

/** Accepts full URLs, `owner/repo` shorthand, or `github.com/owner/repo`. */
export function parseGitHubInput(raw: string): ParsedTarget | null {
  const input = raw.trim();
  if (!input) return null;

  // Strip protocol and host
  let rest = input;
  const protocolMatch = /^https?:\/\//i.exec(rest);
  if (protocolMatch) rest = rest.slice(protocolMatch[0].length);

  const hostMatch = /^(?:www\.)?(github\.com|raw\.githubusercontent\.com)\//i.exec(
    rest,
  );
  if (hostMatch) rest = rest.slice(hostMatch[0].length);

  rest = rest.split(/[?#]/)[0].replace(/^\/+/, "");
  if (!rest) return null;

  const segments = rest.split("/").filter(Boolean).map(decodeURIComponent);
  if (segments.length < 2) return null;

  const owner = segments[0];
  const repo = cleanRepoName(segments[1]);

  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return null;

  const out: ParsedTarget = { owner, repo, kind: "repo" };

  // /tree/<ref>/<path...> or /blob/<ref>/<path...>
  const type = segments[2]?.toLowerCase();
  if ((type === "tree" || type === "blob") && segments.length >= 4) {
    out.kind = type === "blob" ? "blob" : "tree";
    out.ref = segments[3];
    out.path = segments.slice(4).join("/") || undefined;
  } else if (type === "tree" || type === "blob") {
    out.kind = type === "blob" ? "blob" : "tree";
  }

  return out;
}

export function isLikelyValidTarget(parsed: ParsedTarget | null): boolean {
  return Boolean(parsed && parsed.owner && parsed.repo);
}

export function formatRepoSlug(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}
