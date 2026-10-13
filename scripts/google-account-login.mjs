// Authenticate Google's official Antigravity runtime through ACP.
// Google owns the browser flow and credential storage; no API key is used.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const command = fileURLToPath(
  new URL("../.runtime/antigravity/agy_acp_server.par", import.meta.url),
);
const child = spawn(command, [], { stdio: ["pipe", "pipe", "inherit"] });
const input = createInterface({ input: child.stdout });
const pending = new Map();
let nextId = 0;
function request(method, params) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
    );
  });
}
input.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  const operation = pending.get(message.id);
  if (!operation) return;
  pending.delete(message.id);
  if (message.error) operation.reject(new Error(message.error.message));
  else operation.resolve(message.result);
});
child.on("error", (error) => {
  for (const operation of pending.values()) operation.reject(error);
});
child.on("exit", () => {
  for (const operation of pending.values())
    operation.reject(new Error("Google agent exited"));
});
const timeout = setTimeout(() => child.kill("SIGTERM"), 600000);
process.on("SIGINT", () => child.kill("SIGTERM"));
try {
  const initialized = await request("initialize", {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: { name: "coding-skins-login", version: "0.1.0" },
  });
  if (
    !initialized.authMethods?.some((method) => method.id === "oauth-personal")
  ) {
    throw new Error("Google account sign-in is unavailable in this runtime");
  }
  console.log(
    "Complete Google's browser sign-in using the account with Google AI Pro.",
  );
  await request("authenticate", { methodId: "oauth-personal" });
  console.log(
    "Google Antigravity sign-in completed. Verify a real response in Coding Skins.",
  );
} catch (error) {
  console.error("Google sign-in failed: " + error.message);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  child.kill("SIGTERM");
  input.close();
}
