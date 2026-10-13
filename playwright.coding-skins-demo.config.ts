import { defineConfig } from "@playwright/test";

// Tests the persistent demo started with scripts/start-demo.mjs.
export default defineConfig({
  testDir: "./tests/e2e/skins-demo",
  testMatch: "coding-skins-demo.spec.ts",
  timeout: 90000,
  workers: 1,
  outputDir: "test-results-skins-demo",
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1600, height: 1000 },
    screenshot: "only-on-failure",
  },
});
