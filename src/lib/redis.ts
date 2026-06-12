/**
 * Upstash Redis REST API Client
 *
 * Serverless-compatible Redis client using the Upstash REST API.
 * No persistent connections — every operation is a single HTTP request.
 *
 * Required environment variables:
 * - UPSTASH_REDIS_URL  (e.g. https://your-redis.upstash.io)
 * - UPSTASH_REDIS_TOKEN
 *
 * All functions gracefully return fallback values when Redis is not configured
 * and never throw — making them safe to use as drop-in caches.
 */

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.UPSTASH_REDIS_URL ?? "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN ?? "";

/**
 * Check whether both Upstash Redis environment variables are set.
 */
export function isRedisConfigured(): boolean {
  return REDIS_URL.length > 0 && REDIS_TOKEN.length > 0;
}

// ---------------------------------------------------------------------------
// Low-level REST helper
// ---------------------------------------------------------------------------

interface RedisResponse {
  result?: unknown;
  error?: string;
}

/**
 * Execute an arbitrary Redis command via the Upstash REST API.
 *
 * @see https://upstash.com/docs/redis/features/restapi
 */
async function redisCommand<T = unknown>(
  command: string[],
): Promise<T | null> {
  if (!isRedisConfigured()) {
    return null;
  }

  try {
    const res = await fetch(`${REDIS_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Redis] HTTP ${res.status}: ${text}`);
      return null;
    }

    const data: RedisResponse = await res.json();

    if (data.error) {
      console.error(`[Redis] Command error: ${data.error}`);
      return null;
    }

    return (data.result as T) ?? null;
  } catch (err) {
    console.error("[Redis] Request failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core key/value operations
// ---------------------------------------------------------------------------

/**
 * Get a cached string value by key.
 *
 * Returns `null` when the key does not exist **or** Redis is unavailable.
 */
export async function redisGet(key: string): Promise<string | null> {
  return redisCommand<string>(["GET", key]);
}

/**
 * Set a cached string value with an optional TTL.
 *
 * @returns `true` when the SET succeeded, `false` otherwise.
 */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<boolean> {
  if (!isRedisConfigured()) {
    return false;
  }

  const command: string[] = ttlSeconds
    ? ["SET", key, value, "EX", String(Math.floor(ttlSeconds))]
    : ["SET", key, value];

  const result = await redisCommand<string>(command);
  return result === "OK";
}

/**
 * Delete a cached value.
 *
 * @returns `true` if the key was removed, `false` otherwise.
 */
export async function redisDel(key: string): Promise<boolean> {
  if (!isRedisConfigured()) {
    return false;
  }

  const result = await redisCommand<number>(["DEL", key]);
  return typeof result === "number" && result > 0;
}

// ---------------------------------------------------------------------------
// Counter / rate-limiting primitive
// ---------------------------------------------------------------------------

/**
 * Atomically increment a counter.
 *
 * @returns The new value of the counter after increment, or `-1` on failure.
 */
export async function redisIncr(key: string): Promise<number> {
  const result = await redisCommand<number>(["INCR", key]);
  return typeof result === "number" ? result : -1;
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

/**
 * Sliding-window rate limiter.
 *
 * Uses INCR + EXPIRE to implement a simple fixed-window counter:
 * 1. Increment the counter for the given identifier + window.
 * 2. On the first request in a window (counter === 1), set the TTL.
 * 3. Compare the counter against `maxRequests`.
 *
 * @param identifier   Unique key (e.g. IP address, user ID, API key).
 * @param maxRequests  Maximum number of requests allowed in the window.
 * @param windowSeconds  Duration of the fixed window in seconds.
 * @returns `{ allowed, remaining }` — `allowed` is `true` when under the limit.
 */
export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!isRedisConfigured()) {
    // When Redis is not available, allow everything.
    return { allowed: true, remaining: maxRequests };
  }

  const key = `ratelimit:${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

  try {
    const count = await redisIncr(key);

    if (count === -1) {
      // Redis command failed — fail open.
      return { allowed: true, remaining: maxRequests };
    }

    // On the very first hit in this window, set the expiry.
    if (count === 1) {
      await redisCommand<number>(["EXPIRE", key, String(windowSeconds)]);
    }

    const remaining = Math.max(0, maxRequests - count);

    return {
      allowed: count <= maxRequests,
      remaining,
    };
  } catch (err) {
    console.error("[Redis] Rate limit check failed:", err);
    return { allowed: true, remaining: maxRequests };
  }
}

// ---------------------------------------------------------------------------
// Cache wrapper
// ---------------------------------------------------------------------------

/**
 * Get a value from cache, or fetch it and cache the result.
 *
 * - When Redis is not configured, the fetcher is always called.
 * - On cache misses the fetcher is called, its result is serialised as JSON,
 *   and stored with the given TTL.
 * - On cache hits the stored JSON is parsed back into `T`.
 *
 * @param key        Cache key (use a descriptive prefix like `"products:featured"`).
 * @param fetcher    Async function that produces the value when absent from cache.
 * @param ttlSeconds Optional TTL in seconds. When omitted the key persists indefinitely.
 */
export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds?: number,
): Promise<T> {
  // Fast path — try cache first.
  const cached = await redisGet(key);
  if (cached !== null) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Corrupt cache entry — delete and re-fetch.
      await redisDel(key);
    }
  }

  // Cache miss (or Redis unavailable) — fetch fresh data.
  const value = await fetcher();

  // Best-effort: store in cache. Failure is non-fatal.
  await redisSet(key, JSON.stringify(value), ttlSeconds);

  return value;
}
