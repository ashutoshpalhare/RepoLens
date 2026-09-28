/// <reference lib="webworker" />
import { buildDependencyGraph } from "@/lib/analysis";
import type { DependencyGraph } from "@/types/repo";

export interface DepsWorkerRequest {
  allPaths: string[];
  scanned: { path: string; content: string }[];
  skipped: number;
  sizes: [string, number][];
}

export type DepsWorkerResponse =
  | { ok: true; graph: DependencyGraph }
  | { ok: false; message: string };

self.onmessage = (event: MessageEvent<DepsWorkerRequest>) => {
  const { allPaths, scanned, skipped, sizes } = event.data;
  try {
    const graph = buildDependencyGraph(allPaths, scanned, skipped, new Map(sizes));
    const message: DepsWorkerResponse = { ok: true, graph };
    self.postMessage(message);
  } catch (error) {
    const message: DepsWorkerResponse = {
      ok: false,
      message: error instanceof Error ? error.message : "Analysis failed",
    };
    self.postMessage(message);
  }
};
