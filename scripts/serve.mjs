import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { loadEnvFile } from "node:process";
import { bridgeMiddleware } from "./bridge.mjs";
if (existsSync(".env")) loadEnvFile(".env");
const root = resolve("dist");
if (!existsSync(root)) throw new Error("Run npm run build first");
const bridge = bridgeMiddleware();
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
createServer((req, res) =>
  bridge(req, res, () => {
    let path;
    try {
      path = resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (!path.startsWith(root + sep) && path !== root) {
      res.writeHead(403);
      return res.end();
    }
    if (!existsSync(path) || !statSync(path).isFile())
      path = resolve(root, "index.html");
    res.setHeader(
      "Content-Type",
      mime[extname(path)] || "application/octet-stream",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    createReadStream(path).pipe(res);
  }),
).listen(Number(process.env.PORT || 5180), "127.0.0.1", () =>
  console.log(`Open Skins: http://127.0.0.1:${process.env.PORT || 5180}`),
);
