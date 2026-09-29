// Static build for GitHub Pages (no SSR / no Nitro).
// Usage: bun run build:pages  ->  dist-pages/
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  base: "/RepoLens/",
  publicDir: path.resolve(process.cwd(), "public"),
  plugins: [react(), tailwindcss(), tsconfigPaths({ root: process.cwd() })],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  build: {
    outDir: path.resolve(process.cwd(), "dist-pages"),
    emptyOutDir: true,
  },
});