import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["convex/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["convex/**/*.ts"],
      exclude: ["convex/_generated/**", "convex/**/*.test.ts"],
    },
  },
});
