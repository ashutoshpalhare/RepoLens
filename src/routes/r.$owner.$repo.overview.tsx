import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { LanguageBars, Section, Stat } from "@/components/repolens/InsightsPanel";
import { copyText, formatBytes, formatTreeAscii } from "@/lib/analysis";
import { useRepo } from "@/hooks/useRepoData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/r/$owner/$repo/overview")({
  head: ({ params }) => {
    const title = `${params.owner}/${params.repo} overview — RepoLens`;
    const description = `Language mix, file counts, size and largest files in ${params.owner}/${params.repo}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Overview,
});

function Overview() {
  const { owner, repo } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useRepo({ owner, repo });
  const [depth, setDepth] = useState<2 | 3 | 99>(3);

  const treeText = useMemo(() => {
    if (!data?.fileTree?.length) return "";
    return formatTreeAscii(data.fileTree, { maxDepth: depth, rootName: repo });
  }, [data?.fileTree, depth, repo]);

  if (!data) return null;

  const { meta, insights, truncated } = data;

  const onCopyTree = async () => {
    if (!treeText) return;
    const ok = await copyText(treeText);
    if (ok) toast.success("Directory tree copied");
    else toast.error("Could not copy to clipboard");
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto px-6 py-8">
      <div className="animate-fade-up mx-auto max-w-5xl space-y-8">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {meta.description || "No description provided."}
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Files" value={insights.totalFiles.toLocaleString()} />
          <Stat label="Folders" value={insights.totalFolders.toLocaleString()} />
          <Stat
            label="Repo size"
            value={formatBytes(meta.size * 1024)}
            hint={`Tracked blobs ${formatBytes(insights.totalBytes)}`}
          />
          <Stat label="Stars" value={meta.stargazers_count.toLocaleString()} />
          <Stat label="Forks" value={meta.forks_count.toLocaleString()} />
          <Stat label="Open issues" value={meta.open_issues_count.toLocaleString()} />
          <Stat label="Default branch" value={meta.default_branch} />
          <Stat label="License" value={meta.license?.spdx_id || "None"} />
        </div>

        {truncated && (
          <p className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
            GitHub truncated this repository&apos;s file tree, so counts below cover only the files it
            returned.
          </p>
        )}

        {treeText && (
          <Section
            title="Directory tree"
            action={
              <button
                type="button"
                onClick={onCopyTree}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                <Copy className="size-3" />
                Copy tree
              </button>
            }
          >
            <div className="mb-3 flex flex-wrap gap-1">
              {(
                [
                  [2, "Depth 2"],
                  [3, "Depth 3"],
                  [99, "All"],
                ] as const
              ).map(([d, label]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={cn(
                    "rounded border px-2 py-0.5 font-mono text-[10px] transition-colors",
                    depth === d
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
              {treeText}
            </pre>
          </Section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Languages & file types">
            <LanguageBars languages={insights.languages} limit={10} />
          </Section>

          <Section title="Project structure">
            <ul className="space-y-1.5">
              {insights.topLevel.map((entry) => (
                <li key={entry.path} className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-xs text-foreground">{entry.path}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {entry.files} files
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Largest files">
            <ul className="space-y-1.5">
              {insights.largestFiles.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/r/$owner/$repo", params: { owner, repo } })}
                    className="flex w-full items-center justify-between gap-3 text-left transition-colors hover:text-primary"
                  >
                    <span className="truncate font-mono text-xs text-foreground">{file.path}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Notable directories">
            {insights.notableDirs.length ? (
              <ul className="space-y-1.5">
                {insights.notableDirs.map((dir) => (
                  <li key={dir.path} className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-xs text-foreground">{dir.path}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {dir.files} files
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No deeply nested source directories detected.
              </p>
            )}
          </Section>

          <Section title="Configuration">
            {insights.configFiles.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {insights.configFiles.map((file) => (
                  <li
                    key={file}
                    className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {file}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No common config files detected.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}