import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { IndexPage } from "./routes/index";
import { AboutPage } from "./routes/about";
import { WorkspacePage } from "./routes/r.$owner.$repo";

/**
 * Hash history keeps deep links working on GitHub Pages (static hosting,
 * no rewrites) while staying 100% client-side.
 */
const rootRoute = createRootRoute({ component: () => <Outlet /> });

const validateWorkspaceSearch = (search: Record<string, unknown>) => {
  const ref = typeof search.ref === "string" ? search.ref.trim() : "";
  return { ref: ref || undefined };
};

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/r/$owner/$repo",
  validateSearch: validateWorkspaceSearch,
  component: WorkspacePage,
});

const workspaceFileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/r/$owner/$repo/$",
  validateSearch: validateWorkspaceSearch,
  component: WorkspacePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  workspaceRoute,
  workspaceFileRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: false,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
