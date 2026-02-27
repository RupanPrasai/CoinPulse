import "dotenv/config";
import { Worker } from "bullmq";
import { connectDb } from "../db.js";
import { PriceSnapshot } from "../models/PriceSnapshot.js";
import { CoinMetric } from "../models/CoinMetrics.js";
import { movingAverage, pctChange, volatility } from "../services/analysis.js";
import { ANALYZE_SNAPSHOT_JOB, type AnalyzeSnapshotJob } from "../queue/analysisQueue.js";
import { getRedis } from "../queue/connection.js";

function getAnalyzePoints(): number {
  const raw = process.env.ANALYZE_POINTS ?? "12";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw new Error("ANALYZE_POINTS must be a positive number");
  return Math.floor(n);
}

async function main() {
  await connectDb();

  const windowPoints = getAnalyzePoints();

  const worker = new Worker<AnalyzeSnapshotJob>(
    "analysis",
    async (job) => {
      if (job.name !== ANALYZE_SNAPSHOT_JOB) return;

      const { coinId, vsCurrency } = job.data;

      const docs = await PriceSnapshot.find({ coinId, vsCurrency })
        .sort({ collectedAt: -1 })
        .limit(windowPoints)
        .lean();

      if (docs.length === 0) {
        console.warn(`[analyzer] no snapshots for ${coinId}/${vsCurrency}`);
        return;
      }

      const prices = docs
        .slice()
        .reverse()
        .map((d) => d.price);

      const latestPrice = prices[prices.length - 1];
      const ma = movingAverage(prices);
      const pc = pctChange(prices);
      const vol = volatility(prices);

      await CoinMetric.updateOne(
        { coinId, vsCurrency, windowPoints },
        {
          $set: {
            latestPrice,
            movingAverage: ma,
            pctChange: pc,
            volatility: vol,
            sampleCount: prices.length,
            computedAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(
        `[analyzer] computed ${coinId}/${vsCurrency} points=${prices.length} ma=${ma.toFixed(
          2
        )} pct=${pc.toFixed(2)} vol=${vol.toFixed(6)}`
      );
    },
    {
      connection: getRedis(),
      concurrency: 2,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[analyzer] job failed id=${job?.id} name=${job?.name}`, err);
  });

  console.log("[analyzer] worker started (queue=analysis)");
}

main().catch((err) => {
  console.error("[analyzer] fatal:", err);
  process.exit(1);
});
