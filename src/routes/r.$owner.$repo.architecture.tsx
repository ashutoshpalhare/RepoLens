import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArchitectureView } from "@/components/repolens/ArchitectureView";
import { useDependencyGraph, useRepo } from "@/hooks/useRepoData";

export const Route = createFileRoute("/r/$owner/$repo/architecture")({
  head: ({ params }) => {
    const title = `${params.owner}/${params.repo} architecture — RepoLens`;
    const description = `Module map and import relationships detected in ${params.owner}/${params.repo}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Architecture,
});

function Architecture() {
  const { owner, repo } = Route.useParams();
  const navigate = useNavigate();
  const repoQuery = useRepo({ owner, repo });
  const branch = repoQuery.data?.meta.default_branch;
  const graph = useDependencyGraph({ owner, repo }, branch, repoQuery.data?.entries);

  return (
    <ArchitectureView
      graph={graph.data}
      isPending={graph.isPending || graph.isFetching}
      error={graph.error}
      onRetry={() => graph.refetch()}
      onCancel={() => graph.cancel()}
      progress={graph.progress}
      percent={graph.percent}
      onOpenFile={(path: string) => {
        void navigate({
          to: "/r/$owner/$repo",
          params: { owner, repo },
          search: { path },
        });
      }}
    />
  );
}