// @vitest-environment node
import type { IncomingMessage, ServerResponse } from "node:http";
import { it, expect, vi } from "vitest";
import { bridgeMiddleware } from "../scripts/bridge.mjs";
it("rejects invalid host and malformed or foreign origins before proxying", () => {
  const bridge = bridgeMiddleware({ OPENHANDS_URL: "http://127.0.0.1:1" });
  for (const headers of [
    { host: "evil.example" },
    { host: "127.0.0.1:5180", origin: "https://evil.example" },
    { host: "127.0.0.1:5180", origin: "invalid" },
  ]) {
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const next = vi.fn();
    bridge(
      { url: "/bridge/openhands/conversations", headers } as IncomingMessage,
      res as unknown as ServerResponse,
      next,
    );
    expect(res.writeHead).toHaveBeenCalledWith(
      headers.host === "evil.example" ? 421 : 403,
    );
    expect(next).not.toHaveBeenCalled();
  }
});
