import IORedis from "ioredis";

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  redis = new IORedis(url, {
    // BullMQ recommends disabling ioredis request retry limits.
    maxRetriesPerRequest: null,
  });

  redis.on("error", (err) => {
    // Don't crash the process here; let callers decide how to handle.
    console.error("[redis] error:", err);
  });

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (!redis) return;
  await redis.quit();
  redis = null;
}
