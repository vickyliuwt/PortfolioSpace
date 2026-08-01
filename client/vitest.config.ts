// vitest setup
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: ["app/lib/**/*.ts", "app/components/MentionText.tsx"],
      exclude: ["app/lib/__tests__/**", "app/lib/api.ts"],
      thresholds: { lines: 60, functions: 55, statements: 60, branches: 50 },
    },
  },
});
