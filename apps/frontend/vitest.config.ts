import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
    exclude: ["e2e/**", "**/node_modules/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/**/*.d.ts", "src/test/**"],
    },
  },
  resolve: {
    alias: {
      "@legal-express/shared": new URL(
        "../../packages/shared/src/index.ts",
        import.meta.url
      ).pathname,
    },
  },
});
