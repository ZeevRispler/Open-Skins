import httpProxy from "http-proxy";
import { readFileSync, existsSync } from "node:fs";
export function bridgeMiddleware(env = process.env) {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    proxyTimeout: 60000,
  });
  const targets = {
    openhands: env.OPENHANDS_URL || "http://127.0.0.1:8000",
    opencode: env.OPENCODE_URL || "http://127.0.0.1:4096",
  };
  for (const target of Object.values(targets)) {
    const url = new URL(target);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error("Invalid backend URL");
  }
  const file = env.OPENHANDS_SESSION_KEY_FILE;
  const key =
    env.OPENHANDS_API_KEY ||
    (file && existsSync(file) ? readFileSync(file, "utf8").trim() : undefined);
  proxy.on("error", (_error, _req, res) => {
    if ("writeHead" in res && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Backend unavailable. Start the configured agent server.",
        }),
      );
    }
  });
  return (req, res, next) => {
    if (!/^\/(bridge)\/(openhands|opencode)(\/|$)/.test(req.url || ""))
      return next();
    if (
      !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host || "")
    ) {
      res.writeHead(421);
      return res.end("Invalid host");
    }
    if (req.headers.origin) {
      let valid = false;
      try {
        valid = new URL(req.headers.origin).host === req.headers.host;
      } catch {
        valid = false;
      }
      if (!valid) {
        res.writeHead(403);
        return res.end("Cross-origin request rejected");
      }
    }
    const name = req.url.split("/")[2];
    req.url = req.url.replace(`/bridge/${name}`, "") || "/";
    delete req.headers.cookie;
    delete req.headers.authorization;
    delete req.headers["x-session-api-key"];
    if (name === "openhands" && key) req.headers["x-session-api-key"] = key;
    if (name === "opencode" && env.OPENCODE_SERVER_PASSWORD)
      req.headers.authorization =
        "Basic " +
        Buffer.from(
          (env.OPENCODE_SERVER_USERNAME || "opencode") +
            ":" +
            env.OPENCODE_SERVER_PASSWORD,
        ).toString("base64");
    proxy.web(req, res, { target: targets[name] });
  };
}
