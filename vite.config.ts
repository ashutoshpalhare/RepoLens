import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/RepoLens/",
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
    spa: {
      enabled: true,
    },
  },

  // Optional but recommended for pure static hosting
  nitro: {
    preset: "static",
  },
});
