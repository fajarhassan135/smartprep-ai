type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * A cheap per-user cap on the AI routes so one signed-in account cannot sit in
 * a loop spending the Groq key.
 *
 * This is in-process: on a serverless host each instance keeps its own counter,
 * so the real ceiling is (limit x live instances). It stops casual abuse, not a
 * determined attacker. If this needs to be a hard limit, move the counter into
 * Postgres or Upstash where every instance can see it.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;

  // Drop expired buckets occasionally so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
