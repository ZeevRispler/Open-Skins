import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  use: {
    baseURL: process.env.SKIN_TEST_URL || "http://127.0.0.1:5182",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: process.env.SKIN_TEST_URL
    ? undefined
    : {
        command: "PORT=5182 npm run dev",
        url: "http://127.0.0.1:5182",
        reuseExistingServer: !process.env.CI,
      },
  reporter: "list",
});
