import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const from = path.join(root, "client", "dist");
const to = path.join(root, "server", "public");

if (!fs.existsSync(from)) {
  console.error(`Missing client build output: ${from}\nRun the client build first.`);
  process.exit(1);
}

fs.rmSync(to, { recursive: true, force: true });
fs.mkdirSync(to, { recursive: true });
fs.cpSync(from, to, { recursive: true });

console.log(`Copied ${from} -> ${to}`);
