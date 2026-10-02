import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  buildDependencyGraph,
  buildFileTree,
  computeInsights,
  pickSourceFilesForAnalysis,
} from "@/lib/analysis";
import { fetchFileContent, fetchRepoMeta, fetchRepoTree } from "@/lib/github";
import type { DepsWorkerRequest, DepsWorkerResponse } from "@/lib/deps.worker";
import type { DependencyGraph, RepoRef } from "@/types/repo";

function runInWorker(payload: DepsWorkerRequest, signal?: AbortSignal) {
  return new Promise<DependencyGraph>((resolve, reject) => {
    const worker = new Worker(new URL("../lib/deps.worker.ts", import.meta.url), {
      type: "module",
    });
    const done = (fn: () => void) => {
      worker.terminate();
      fn();
    };
    const onAbort = () => {
      done(() => reject(new DOMException("Architecture scan cancelled", "AbortError")));
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
    worker.onmessage = (event: MessageEvent<DepsWorkerResponse>) => {
      const data = event.data;
      done(() => (data.ok ? resolve(data.graph) : reject(new Error(data.message))));
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

export type ArchProgress = {
  done: number;
  total: number;
  phase: "idle" | "fetching" | "analyzing" | "done";
};

export function useDependencyGraph(
  ref: RepoRef,
  branch: string | undefined,
  entries: { path: string; type: string; size?: number }[] | undefined,
) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ArchProgress>({
    done: 0,
    total: 0,
    phase: "idle",
  });

  const queryKey = ["deps", ref.owner, ref.repo, branch] as const;

  const query = useQuery({
    queryKey,
    enabled: !!branch && !!entries?.length,
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const all = entries as Parameters<typeof pickSourceFilesForAnalysis>[0];
      const candidates = pickSourceFilesForAnalysis(all);
      const allPaths = all.filter((e) => e.type === "blob").map((e) => e.path);
      const total = candidates.length;

      setProgress({ done: 0, total, phase: "fetching" });

      const scanned: { path: string; content: string }[] = [];
      let skipped = 0;
      const concurrency = 6;
      let cursor = 0;
      let finished = 0;

      const bump = () => {
        finished += 1;
        setProgress({ done: finished, total, phase: "fetching" });
      };

      const worker = async () => {
        while (cursor < candidates.length) {
          if (signal.aborted) {
            throw new DOMException("Architecture scan cancelled", "AbortError");
          }
          const item = candidates[cursor++]!;
          try {
            const content = await fetchFileContent(ref, branch!, item.path);
            if (signal.aborted) {
              throw new DOMException("Architecture scan cancelled", "AbortError");
            }
            scanned.push({ path: item.path, content });
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") throw err;
            skipped += 1;
          } finally {
            bump();
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      if (signal.aborted) {
        throw new DOMException("Architecture scan cancelled", "AbortError");
      }

      setProgress({ done: total, total, phase: "analyzing" });

      const sizeEntries: [string, number][] = [];
      for (const e of all) if (e.type === "blob") sizeEntries.push([e.path, e.size ?? 0]);

      let graph: DependencyGraph;
      if (typeof window !== "undefined" && typeof Worker !== "undefined") {
        try {
          graph = await runInWorker(
            { allPaths, scanned, skipped, sizes: sizeEntries },
            signal,
          );
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;
          graph = buildDependencyGraph(allPaths, scanned, skipped, new Map(sizeEntries));
        }
      } else {
        graph = buildDependencyGraph(allPaths, scanned, skipped, new Map(sizeEntries));
      }

      setProgress({ done: total, total, phase: "done" });
      return graph;
    },
  });

  const cancel = useCallback(() => {
    void queryClient.cancelQueries({ queryKey });
    setProgress((p) => ({ ...p, phase: "idle" }));
  }, [queryClient, queryKey]);

  const percent =
    progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

  return {
    ...query,
    progress,
    percent,
    cancel,
  };
}