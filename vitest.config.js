import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "uis/backoffice"),
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      enabled: false,
    },
  },
});
