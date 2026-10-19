import { jobQueueBackend } from "./config";

function redisUrl(): string | undefined {
  return process.env.REDIS_URL?.trim() || undefined;
}

type RedisClient = {
  lpush(key: string, value: string): Promise<number>;
  brpop(key: string, timeoutSec: number): Promise<[string, string] | null>;
  quit(): Promise<string>;
};

const QUEUE_KEY = "spinesync:job-queue";

let clientPromise: Promise<RedisClient | null> | null = null;

export function redisQueueEnabled(): boolean {
  return jobQueueBackend() === "redis" && Boolean(redisUrl());
}

async function getRedis(): Promise<RedisClient | null> {
  if (!redisQueueEnabled()) return null;
  if (!clientPromise) {
    clientPromise = (async () => {
      const { default: Redis } = await import("ioredis");
      return new Redis(redisUrl()!) as unknown as RedisClient;
    })();
  }
  return clientPromise;
}

export async function enqueueRedisJob(jobId: string): Promise<void> {
  if (jobQueueBackend() === "redis" && !redisUrl()) {
    throw new Error("JOB_QUEUE_BACKEND=redis but REDIS_URL is not set");
  }
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.lpush(QUEUE_KEY, jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redis LPUSH failed";
    throw new Error(message);
  }
}

export async function claimRedisJobId(timeoutSec = 2): Promise<string | null> {
  const redis = await getRedis();
  if (!redis) return null;
  const res = await redis.brpop(QUEUE_KEY, timeoutSec);
  return res ? res[1] : null;
}
