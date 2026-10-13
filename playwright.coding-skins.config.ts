import { defineConfig } from "@playwright/test";
import base from "./playwright.mock-llm.config";
import defaults from "./config/defaults.json" with { type: "json" };

// Isolated ports: never reuse or modify the user's live Google-connected stack.
const servers = Array.isArray(base.webServer)
  ? base.webServer
  : [base.webServer!];
const mock = servers[0];
const stack = servers[1];
export default defineConfig({
  ...base,
  testMatch: /coding-skins\.spec\.ts/,
  projects: [
    {
      name: "chromium",
      use: {
        ...base.projects?.[0]?.use,
        viewport: { width: 1600, height: 1000 },
      },
    },
  ],
  use: {
    ...base.use,
    viewport: { width: 1600, height: 1000 },
    video: "retain-on-failure",
  },
  webServer: [
    {
      ...mock,
      command: `uv run --no-project --python 3.13 --with openhands-sdk==${defaults.versions.agentServer} python tests/e2e/mock-llm/scripts/mock-llm-server.py --port 9999`,
      timeout: 120000,
    },
    {
      ...stack,
      command: stack.command.replace(
        "exec env",
        "exec env OH_CANVAS_SAFE_BACKEND_PORT=18500 OH_CANVAS_SAFE_AUTOMATION_PORT=18502 OH_CANVAS_SAFE_VITE_PORT=18503 OH_CANVAS_SAFE_VSCODE_PORT=18501 OH_SECRET_KEY_PATH=.tmp/coding-skins-secret.txt",
      ),
    },
  ],
});
