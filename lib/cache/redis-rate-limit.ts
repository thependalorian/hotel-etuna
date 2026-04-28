/**
 * TCP Redis fixed-window rate limiting (Node.js only — not Edge middleware).
 *
 * Purpose: Shared counters when REDIS_URL points at Docker Redis or TCP Redis.
 * Location: /lib/cache/redis-rate-limit.ts
 */

import 'server-only';

import Redis from 'ioredis';

let redis: Redis | null = null;

function getClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }
  return redis;
}

function windowMsFromConfig(window: string): number {
  const windowMatch = window.match(/(\d+)\s*(s|m|h)/);
  if (!windowMatch) return 60000;
  const [, amount, unit] = windowMatch;
  return (
    parseInt(amount, 10) *
    (unit === 's' ? 1000 : unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 60000)
  );
}

const FIXED_WINDOW_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { count, ttl }
`;

export async function checkRateLimitRedisTcp(
  rateLimitKey: string,
  requests: number,
  window: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const client = getClient();
  if (!client) {
    throw new Error('REDIS_URL not configured');
  }

  const windowMs = windowMsFromConfig(window);
  const redisKey = `rl:${rateLimitKey}`;
  const now = Date.now();

  const result = await client.eval(FIXED_WINDOW_SCRIPT, 1, redisKey, windowMs.toString());
  if (!Array.isArray(result) || result.length < 2) {
    throw new Error('Unexpected Redis rate limit response');
  }

  const count = Number(result[0]);
  const pttl = Number(result[1]);
  if (!Number.isFinite(count) || !Number.isFinite(pttl)) {
    throw new Error('Invalid Redis rate limit response');
  }

  const resetAt = pttl > 0 ? now + pttl : now + windowMs;
  const allowed = count <= requests;
  const remaining = Math.max(0, requests - count);

  return { allowed, remaining, resetAt };
}
