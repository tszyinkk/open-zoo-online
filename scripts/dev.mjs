import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { publicCatalog } from "../data/catalog.js";

const root = resolve(new URL("..", import.meta.url).pathname);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? "/", "http://localhost").pathname;
  if (path === "/api/catalog") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify(publicCatalog()));
    return;
  }
  if (path.startsWith("/api/")) {
    response.writeHead(503, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "本機靜態預覽未連接房間資料庫；已部署版本先可測試連線。" }));
    return;
  }
  const file = path === "/" ? "index.html" : path.slice(1);
  try {
    const body = file === "styles.css" ? await readFile(resolve(root, "app/globals.css")) : await readFile(resolve(root, "public", file));
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(4173, "127.0.0.1", () => console.log("Local URL: http://127.0.0.1:4173"));
