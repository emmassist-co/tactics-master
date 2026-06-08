import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

const base = process.env.PREVIEW_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: [...configDefaults.exclude, "**/.optimizer-worktrees/**"]
  }
});
