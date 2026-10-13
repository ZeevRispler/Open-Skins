import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 5180, strictPort: true },
  build: { outDir: "dist", sourcemap: false },
});
