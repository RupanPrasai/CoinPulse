import { Queue } from "bullmq";
import { getRedis } from "./connection.js";

export const ANALYZE_SNAPSHOT_JOB = "analyze-snapshot" as const;

export type AnalyzeSnapshotJob = {
  coinId: string;
  vsCurrency: string;
  snapshotId: string;
};

let analysisQueue: Queue<AnalyzeSnapshotJob> | null = null;

export function getAnalysisQueue(): Queue<AnalyzeSnapshotJob> {
  if (analysisQueue) return analysisQueue;

  analysisQueue = new Queue<AnalyzeSnapshotJob>("analysis", {
    connection: getRedis(),
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  });

  return analysisQueue;
}

export async function closeAnalysisQueue(): Promise<void> {
  if (!analysisQueue) return;
  await analysisQueue.close();
  analysisQueue = null;
}
