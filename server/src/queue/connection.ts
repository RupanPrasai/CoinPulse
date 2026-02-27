import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");

  redis = new Redis(url, {
    maxRetriesPerRequest: null,
  });

  redis.on("error", (err: unknown) => {
    console.error("[redis] error:", err);
  });

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (!redis) return;
  await redis.quit();
  redis = null;
}
