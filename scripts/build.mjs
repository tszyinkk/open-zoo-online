import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "server"), { recursive: true });
await mkdir(resolve(dist, "client"), { recursive: true });
await mkdir(resolve(dist, "data"), { recursive: true });
await mkdir(resolve(dist, ".openai"), { recursive: true });

await cp(resolve(root, "public/index.html"), resolve(dist, "client/index.html"));
await cp(resolve(root, "public/app.js"), resolve(dist, "client/app.js"));
await cp(resolve(root, "app/globals.css"), resolve(dist, "client/styles.css"));
await cp(resolve(root, "worker/index.js"), resolve(dist, "server/index.js"));
await cp(resolve(root, "data/catalog.js"), resolve(dist, "data/catalog.js"));
await cp(resolve(root, ".openai/hosting.json"), resolve(dist, ".openai/hosting.json"));
await cp(resolve(root, "drizzle"), resolve(dist, ".openai/drizzle"), { recursive: true });

const worker = await readFile(resolve(dist, "server/index.js"), "utf8");
if (!worker.includes("export default")) throw new Error("Worker entry is invalid");
await writeFile(resolve(dist, "BUILD_INFO"), `Open Zoo Online 1.0\n${new Date().toISOString()}\n`);
console.log("Built Open Zoo Online into dist/");
