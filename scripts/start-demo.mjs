// @spec CS-006 — Key-free demo uses isolated state and the real Agent Server.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, delimiter } from "node:path";
import {
  ProfilesClient,
  AgentProfilesClient,
} from "@openhands/typescript-client/clients";

const root = fileURLToPath(new URL("..", import.meta.url));
const defaults = JSON.parse(
  readFileSync(resolve(root, "config/defaults.json"), "utf8"),
);
const state = resolve(root, ".runtime/demo/state");
const host = "http://127.0.0.1:5173";
const apiKey = randomBytes(32).toString("hex");
mkdirSync(state, { recursive: true });
const env = {
  ...process.env,
  PATH: resolve(root, ".runtime/bin") + delimiter + process.env.PATH,
  UV_CACHE_DIR: resolve(root, ".runtime/uv-cache"),
  OH_CANVAS_SAFE_STATE_DIR: state,
  OH_CANVAS_SAFE_BACKEND_PORT: "18600",
  OH_CANVAS_SAFE_AUTOMATION_PORT: "18602",
  OH_CANVAS_SAFE_VITE_PORT: "18603",
  OH_CANVAS_SAFE_VSCODE_PORT: "18601",
  OH_SECRET_KEY_PATH: resolve(state, "secret-key.txt"),
  LOCAL_BACKEND_API_KEY: apiKey,
  PORT: "5173",
  VITE_MOCK_API: "false",
  VITE_DO_NOT_TRACK: "1",
  VITE_ENABLE_BROWSER_TOOLS: "false",
};
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 5000);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
function run(command, args) {
  const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
  children.push(child);
  child.on("error", () => stop(1));
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
  return child;
}
async function ready(url) {
  for (let attempt = 0; attempt < 180; attempt++) {
    if (stopping) throw new Error("Demo process stopped");
    try {
      if (
        (
          await fetch(url, {
            signal: AbortSignal.timeout(1000),
            headers: url.startsWith(host)
              ? { "X-Session-API-Key": apiKey }
              : {},
          })
        ).ok
      )
        return;
    } catch {
      /* startup */
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error("Demo startup timed out");
}
try {
  run("uv", [
    "run",
    "--no-project",
    "--python",
    "3.13",
    "--with",
    `openhands-sdk==${defaults.versions.agentServer}`,
    "python",
    "scripts/demo-llm-server.py",
  ]);
  await ready("http://127.0.0.1:9998/");
  run("node", ["bin/agent-canvas.mjs"]);
  await ready(host + "/api/automation/v1");
  const options = { host, apiKey };
  const profiles = new ProfilesClient(options);
  const name = "local-scripted-demo";
  await profiles.saveProfile(name, {
    include_secrets: true,
    llm: {
      model: "openai/local-demo",
      api_key: "local-demo-placeholder",
      base_url: "http://127.0.0.1:9998",
    },
  });
  await profiles.activateProfile(name);
  const agents = new AgentProfilesClient(options);
  await agents.saveAgentProfile("default", {
    agent_kind: "openhands",
    llm_profile_ref: name,
    secret_refs: [],
  });
  const { profile } = await agents.getAgentProfile("default");
  await agents.activateAgentProfile(profile.id);
  profiles.close();
  agents.close();
  console.log(
    "\nCoding Skins demo ready: " +
      host +
      "\nSend any message to run the scripted file + terminal demo. Send 'slow demo' to test Stop / Resume. No provider key or account required.\n",
  );
} catch (error) {
  console.error("Demo failed: " + error.message);
  stop(1);
}
