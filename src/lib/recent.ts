export type RecentRepo = {
  owner: string;
  repo: string;
  description: string | null;
  openedAt: number;
};

const KEY = "repolens.recentRepos";
const MAX_RECENT = 6;

export function getRecentRepos(): RecentRepo[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentRepo => Boolean(
        item &&
        typeof item === "object" &&
        typeof (item as RecentRepo).owner === "string" &&
        typeof (item as RecentRepo).repo === "string" &&
        typeof (item as RecentRepo).openedAt === "number",
      ))
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function rememberRepo(repo: Omit<RecentRepo, "openedAt">): RecentRepo[] {
  const next = [
    { ...repo, openedAt: Date.now() },
    ...getRecentRepos().filter(
      (item) =>
        `${item.owner}/${item.repo}`.toLowerCase() !==
        `${repo.owner}/${repo.repo}`.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Recent repositories are a convenience and can safely fail closed.
  }
  return next;
}

export function clearRecentRepos() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore blocked storage.
  }
}