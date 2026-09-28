import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CodeViewer } from "@/components/repolens/CodeViewer";
import { FileExplorer } from "@/components/repolens/FileExplorer";
import { InsightsPanel } from "@/components/repolens/InsightsPanel";
import { useRepo } from "@/hooks/useRepoData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/r/$owner/$repo/")({
  component: CodeWorkspace,
});

const PANES = ["Files", "Code", "Insights"] as const;
type Pane = (typeof PANES)[number];

function CodeWorkspace() {
  const { owner, repo } = Route.useParams();
  const { data } = useRepo({ owner, repo });
  const [path, setPath] = useState<string | null>(null);
  const [pane, setPane] = useState<Pane>("Files");

  const size = useMemo(
    () => data?.entries.find((e) => e.path === path)?.size,
    [data?.entries, path],
  );

  if (!data) return null;
  const branch = data.meta.default_branch;

  const select = (next: string) => {
    setPath(next);
    setPane("Code");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        role="tablist"
        aria-label="Workspace panes"
        className="flex shrink-0 gap-1 border-b border-border bg-surface px-3 py-2 lg:hidden"
      >
        {PANES.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pane === p}
            onClick={() => setPane(p)}
            className={cn(
              "rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
              pane === p
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(260px,340px)]">
        <div
          className={cn(
            "min-h-0 border-border lg:block lg:border-r",
            pane === "Files" ? "block" : "hidden",
          )}
        >
          <FileExplorer tree={data.fileTree} activePath={path} onSelect={select} />
        </div>
        <div className={cn("min-h-0 lg:block", pane === "Code" ? "block" : "hidden")}>
          <CodeViewer
            ref_={{ owner, repo }}
            branch={branch}
            path={path}
            size={size ?? 0}
            blobUrlBase={`${data.meta.html_url}/blob/${branch}`}
          />
        </div>
        <div
          className={cn(
            "min-h-0 border-border bg-surface lg:block lg:border-l",
            pane === "Insights" ? "block" : "hidden",
          )}
        >
          <InsightsPanel meta={data.meta} insights={data.insights} onSelectFile={select} />
        </div>
      </div>
    </div>
  );
}
