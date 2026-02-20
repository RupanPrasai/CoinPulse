import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

export function createApp() {
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

  return app;
}
