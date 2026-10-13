import { createServer } from "vite";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { bridgeMiddleware } from "./bridge.mjs";
if (existsSync(".env")) loadEnvFile(".env");
const bridge = bridgeMiddleware();
const server = await createServer({
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT || 5180),
    strictPort: true,
  },
  plugins: [
    {
      name: "agent-bridge",
      configureServer(server) {
        server.middlewares.use(bridge);
      },
    },
  ],
});
await server.listen();
server.printUrls();
