const DB_NAME = "repolens-file-cache";
const STORE = "files";
const DB_VERSION = 1;
/** Keep at most this many file bodies around. */
const MAX_ENTRIES = 80;
/** Entries older than this are ignored. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type CacheRow = {
  key: string;
  content: string;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

function cacheKey(owner: string, repo: string, branch: string, path: string) {
  return `${owner}/${repo}@${branch}:${path}`;
}

export async function getCachedFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(cacheKey(owner, repo, branch, path));
      req.onsuccess = () => {
        const row = req.result as CacheRow | undefined;
        if (!row) {
          resolve(null);
          return;
        }
        if (Date.now() - row.updatedAt > MAX_AGE_MS) {
          resolve(null);
          return;
        }
        resolve(row.content);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
): Promise<void> {
  // Skip very large bodies so the cache stays lean.
  if (content.length > 800_000) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const row: CacheRow = {
        key: cacheKey(owner, repo, branch, path),
        content,
        updatedAt: Date.now(),
      };
      store.put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await trimCache(db);
  } catch {
    // cache is best-effort
  }
}

async function trimCache(db: IDBDatabase): Promise<void> {
  const rows = await new Promise<CacheRow[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as CacheRow[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  if (rows.length <= MAX_ENTRIES) return;
  rows.sort((a, b) => a.updatedAt - b.updatedAt);
  const drop = rows.slice(0, rows.length - MAX_ENTRIES);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const row of drop) store.delete(row.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearFileContentCache(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}
