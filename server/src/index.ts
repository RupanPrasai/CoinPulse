import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { connectDb } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/echo", (req, res) => {
  res.json({
    received: req.body ?? null,
    serverTime: new Date().toISOString(),
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.resolve(__dirname, "../public");
app.use(express.static(clientDir));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDir, "index.html"));
});

async function start() {
  const PORT = Number(process.env.PORT) || 3001;

  await connectDb();

  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
