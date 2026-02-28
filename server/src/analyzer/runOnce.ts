import "dotenv/config";
import { Worker } from "bullmq";
import { connectDb } from "../db.js";
import { PriceSnapshot } from "../models/PriceSnapshot.js";
import { CoinMetric } from "../models/CoinMetrics.js";
import { movingAverage, pctChange, volatility } from "../services/analysis.js";
import { ANALYZE_SNAPSHOT_JOB, getAnalysisQueue, closeAnalysisQueue, type AnalyzeSnapshotJob } from "../queue/analysisQueue.js";
import { getRedis, closeRedis } from "../queue/connection.js";

function getAnalyzePoints(): number {
  const raw = process.env.ANALYZE_POINTS ?? "12";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw new Error("ANALYZE_POINTS must be a positive number");
  return Math.floor(n);
}

async function main() {
  await connectDb();
  const windowPoints = getAnalyzePoints();

  const queue = getAnalysisQueue();

  let lastActivity = Date.now();
  const worker = new Worker<AnalyzeSnapshotJob>(
    "analysis",
    async (job) => {
      if (job.name !== ANALYZE_SNAPSHOT_JOB) return;

      const { coinId, vsCurrency } = job.data;

      const docs = await PriceSnapshot.find({ coinId, vsCurrency })
        .sort({ collectedAt: -1 })
        .limit(windowPoints)
        .lean();

      if (docs.length === 0) return;

      const prices = docs.slice().reverse().map((d) => d.price);
      const latestPrice = prices[prices.length - 1];

      await CoinMetric.updateOne(
        { coinId, vsCurrency, windowPoints },
        {
          $set: {
            latestPrice,
            movingAverage: movingAverage(prices),
            pctChange: pctChange(prices),
            volatility: volatility(prices),
            sampleCount: prices.length,
            computedAt: new Date(),
          },
        },
        { upsert: true }
      );

      lastActivity = Date.now();
    },
    { connection: getRedis(), concurrency: 2 }
  );

  worker.on("completed", () => (lastActivity = Date.now()));
  worker.on("failed", () => (lastActivity = Date.now()));

  const MAX_RUN_MS = 120_000;
  const started = Date.now();

  while (true) {
    const counts = await queue.getJobCounts("wait", "active", "delayed");
    const pending = (counts.wait ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);

    const idleLongEnough = pending === 0 && Date.now() - lastActivity > 4000;
    const timedOut = Date.now() - started > MAX_RUN_MS;

    if (idleLongEnough || timedOut) break;

    await new Promise((r) => setTimeout(r, 2000));
  }

  await worker.close();
  await closeAnalysisQueue();
  await closeRedis();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[analyzer-once] fatal:", err);
    process.exit(1);
  });
