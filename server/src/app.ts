import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { PriceSnapshot } from "./models/PriceSnapshot.js";
import { CoinMetric } from "./models/CoinMetrics.js";

export function createApp() {
  const app = express();

  function parsePositiveInt(value: unknown, fallback: number) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
  }

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

  app.get("/api/coins/:coinId/metrics", async (req, res) => {
    const coinId = req.params.coinId;
    const vsCurrency =
      typeof req.query.vsCurrency === "string"
        ? req.query.vsCurrency
        : process.env.COLLECT_VS_CURRENCY || "usd";

    const windowPoints = parsePositiveInt(
      req.query.points,
      parsePositiveInt(process.env.ANALYZE_POINTS, 12)
    );

    const doc = await CoinMetric.findOne({ coinId, vsCurrency, windowPoints })
      .lean();

    if (!doc) {
      return res.status(404).json({
        error: "Metrics not found (run collector/analyzer first)",
        coinId,
        vsCurrency,
        windowPoints,
      });
    }

    res.json({
      coinId: doc.coinId,
      vsCurrency: doc.vsCurrency,
      windowPoints: doc.windowPoints,
      latestPrice: doc.latestPrice,
      movingAverage: doc.movingAverage,
      pctChange: doc.pctChange,
      volatility: doc.volatility,
      sampleCount: doc.sampleCount,
      computedAt: doc.computedAt,
    });
  });

  app.get("/api/coins/:coinId/timeseries", async (req, res) => {
    const coinId = req.params.coinId;
    const vsCurrency =
      typeof req.query.vsCurrency === "string"
        ? req.query.vsCurrency
        : process.env.COLLECT_VS_CURRENCY || "usd";

    const limit = Math.min(
      parsePositiveInt(req.query.limit, 100),
      1000
    );

    const docs = await PriceSnapshot.find({ coinId, vsCurrency })
      .sort({ collectedAt: -1 })
      .limit(limit)
      .lean();

    const points = docs
      .slice()
      .reverse()
      .map((d) => ({ price: d.price, collectedAt: d.collectedAt }));

    res.json({ coinId, vsCurrency, count: points.length, points });
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
