import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { router } from "./router";
import { ThemeProvider, useThemeUI } from "./lib/theme-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ToastLayer() {
  const { theme } = useThemeUI();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border !border-line-strong !text-ink !rounded-xl !font-sans !text-sm !shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]",
          description: "!text-muted",
          success: "!border-ok/40",
          error: "!border-danger/40",
          actionButton: "!bg-accent !text-accent-contrast",
          cancelButton: "!bg-surface-2 !text-muted",
        },
      }}
    />
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-accent-contrast"
          >
            Skip to content
          </a>
          <RouterProvider router={router} />
          <ToastLayer />
        </QueryClientProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
