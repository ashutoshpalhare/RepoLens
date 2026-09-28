import { useQuery } from "@tanstack/react-query";
import {
  buildDependencyGraph,
  buildFileTree,
  computeInsights,
  pickSourceFilesForAnalysis,
} from "@/lib/analysis";
import { fetchFileContent, fetchRepoMeta, fetchRepoTree } from "@/lib/github";
import type { DepsWorkerRequest, DepsWorkerResponse } from "@/lib/deps.worker";
import type { DependencyGraph, RepoRef } from "@/types/repo";

function runInWorker(payload: DepsWorkerRequest) {
  return new Promise<DependencyGraph>((resolve, reject) => {
    const worker = new Worker(new URL("../lib/deps.worker.ts", import.meta.url), {
      type: "module",
    });
    const done = (fn: () => void) => {
      worker.terminate();
      fn();
    };
    worker.onmessage = (event: MessageEvent<DepsWorkerResponse>) => {
      const data = event.data;
      done(() =>
        data.ok ? resolve(data.graph) : reject(new Error(data.message)),
      );
    };
    worker.onerror = () => done(() => reject(new Error("Analysis worker failed")));
    worker.postMessage(payload);
  });
}

export function repoQueryOptions(ref: RepoRef) {
  return {
    queryKey: ["repo", ref.owner, ref.repo] as const,
    queryFn: async () => {
      const meta = await fetchRepoMeta(ref);
      const tree = await fetchRepoTree(ref, meta.default_branch);
      return {
        meta,
        entries: tree.tree,
        truncated: tree.truncated,
        fileTree: buildFileTree(tree.tree),
        insights: computeInsights(tree.tree),
      };
    },
    staleTime: 5 * 60_000,
    retry: false,
  };
}

export function useRepo(ref: RepoRef) {
  return useQuery(repoQueryOptions(ref));
}

export function useFileContent(ref: RepoRef, branch: string | undefined, path: string | null) {
  return useQuery({
    queryKey: ["file", ref.owner, ref.repo, branch, path],
    queryFn: () => fetchFileContent(ref, branch!, path!),
    enabled: !!branch && !!path,
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useDependencyGraph(
  ref: RepoRef,
  branch: string | undefined,
  entries: { path: string; type: string; size?: number }[] | undefined,
) {
  return useQuery({
    queryKey: ["deps", ref.owner, ref.repo, branch],
    enabled: !!branch && !!entries?.length,
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async () => {
      const all = entries as Parameters<typeof pickSourceFilesForAnalysis>[0];
      const candidates = pickSourceFilesForAnalysis(all);
      const allPaths = all.filter((e) => e.type === "blob").map((e) => e.path);

      const scanned: { path: string; content: string }[] = [];
      let skipped = 0;
      const concurrency = 6;
      let cursor = 0;

      const worker = async () => {
        while (cursor < candidates.length) {
          const item = candidates[cursor++]!;
          try {
            const content = await fetchFileContent(ref, branch!, item.path);
            scanned.push({ path: item.path, content });
          } catch {
            skipped += 1;
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));
      const sizeEntries: [string, number][] = [];
      for (const e of all) if (e.type === "blob") sizeEntries.push([e.path, e.size ?? 0]);

      if (typeof window !== "undefined" && typeof Worker !== "undefined") {
        try {
          return await runInWorker({ allPaths, scanned, skipped, sizes: sizeEntries });
        } catch {
          // fall through to synchronous analysis
        }
      }
      return buildDependencyGraph(allPaths, scanned, skipped, new Map(sizeEntries));
    },
  });
}
