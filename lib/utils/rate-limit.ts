/**
 * Rate Limiting Utility
 * 
 * Purpose: Implement rate limiting for API endpoints following system design principles
 * Location: /lib/utils/rate-limit.ts
 * 
 * Implements:
 * - Redis-based rate limiting (production)
 * - In-memory fallback (development)
 * - Per-endpoint rate limits
 * - IP-based and user-based limiting
 * 
 * Following System Design Principles:
 * - API Security (Rate Limiting)
 * - Performance Optimization
 */

import { NextRequest } from 'next/server';
import { normalizePathnameForRateLimit } from '@/lib/utils/api-url';

// Rate limit configuration per endpoint
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': { requests: 5, window: '15 m' },
  '/api/auth/register': { requests: 3, window: '15 m' },
  '/api/auth/forgot-password': { requests: 3, window: '1 h' },

  // Payments & guest orders — abuse protection (Security Prompt Pack §8)
  '/api/payments/virtual': { requests: 5, window: '1 m' },
  '/api/payments/adumo': { requests: 5, window: '1 m' },
  '/api/payments/initiate': { requests: 5, window: '1 m' },
  '/api/guest/stays': { requests: 30, window: '1 m' },
  '/api/guest/loyalty': { requests: 15, window: '1 m' },

  // Sofia / AI — cost control
  '/api/sofia/chat': { requests: 20, window: '1 m' },
  '/api/public/sofia/chat': { requests: 15, window: '1 m' },
  '/api/admin/partners/invite': { requests: 5, window: '1 h' },
  '/api/admin/partners/claim-invite': { requests: 10, window: '1 h' },
  
  // Booking endpoints - moderate limits
  '/api/bookings': { requests: 20, window: '1 m' },
  '/api/bookings/availability': { requests: 30, window: '1 m' },
  
  // Restaurant orders - moderate limits
  '/api/restaurant/orders': { requests: 30, window: '1 m' },
  '/api/public/restaurant/orders': { requests: 20, window: '1 m' },

  // Platform admin — tighter on support mutations path; broader for other admin reads
  '/api/admin/platform/support': { requests: 45, window: '1 m' },
  '/api/admin/platform/compliance': { requests: 30, window: '1 m' },
  '/api/admin/platform': { requests: 120, window: '1 m' },

  // Meta WhatsApp webhooks (burst-friendly; signature verification is primary gate)
  '/api/webhooks/whatsapp': { requests: 300, window: '1 m' },

  // Introducer partners - public endpoints
  '/api/introducers/validate': { requests: 30, window: '1 m' },
  '/api/introducers/public': { requests: 60, window: '1 m' },

  // General API endpoints
  default: { requests: 100, window: '1 m' },
} as const;

// In-memory rate limit store (development fallback)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Get rate limit key from request
 */
export function getRateLimitKey(req: NextRequest, userId?: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const pathname = normalizePathnameForRateLimit(req.nextUrl.pathname);
  
  // Use user ID if available, otherwise use IP
  const identifier = userId || ip;
  return `rate_limit:${pathname}:${identifier}`;
}

/**
 * Check if request should be rate limited
 */
export function shouldRateLimit(pathname: string): boolean {
  const normalized = normalizePathnameForRateLimit(pathname);
  return Object.keys(RATE_LIMITS).some((path) => normalized.startsWith(path));
}

/**
 * Get rate limit configuration for endpoint
 */
export function getRateLimitConfig(pathname: string): { requests: number; window: string } {
  const normalized = normalizePathnameForRateLimit(pathname);
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (normalized.startsWith(path)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

let warnedAboutMemoryFallback = false;

function isRedisRateLimitRequired(): boolean {
  return process.env.RATE_LIMIT_REDIS_REQUIRED === 'true';
}

function denyBecauseRateLimitUnavailable(): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return {
    allowed: false,
    remaining: 0,
    resetAt: Date.now() + 60000,
  };
}

/**
 * Check rate limit using Redis when configured, with in-memory fallback for local development.
 */
export async function checkRateLimit(
  req: NextRequest,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const pathname = req.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  const key = getRateLimitKey(req, userId);

  const onNodeRuntime = process.env.NEXT_RUNTIME !== 'edge';
  if (process.env.REDIS_URL && onNodeRuntime) {
    try {
      const { checkRateLimitRedisTcp } = await import('@/lib/cache/redis-rate-limit');
      return await checkRateLimitRedisTcp(key, config.requests, config.window);
    } catch (err) {
      console.error('[checkRateLimit] Redis error', err);
      if (isRedisRateLimitRequired()) {
        return denyBecauseRateLimitUnavailable();
      }
    }
  }

  if (isRedisRateLimitRequired()) {
    console.error('[checkRateLimit] Redis-backed rate limiting is required but unavailable');
    return denyBecauseRateLimitUnavailable();
  }

  if (!warnedAboutMemoryFallback && process.env.NODE_ENV === 'production') {
    console.warn('[checkRateLimit] Using in-memory rate limiting fallback in production');
    warnedAboutMemoryFallback = true;
  }
  
  // Parse window (e.g., "15 m" = 15 minutes)
  const windowMatch = config.window.match(/(\d+)\s*(s|m|h)/);
  if (!windowMatch) {
    return { allowed: true, remaining: config.requests, resetAt: Date.now() + 60000 };
  }
  
  const [, amount, unit] = windowMatch;
  const windowMs = parseInt(amount) * (
    unit === 's' ? 1000 :
    unit === 'm' ? 60000 :
    unit === 'h' ? 3600000 : 60000
  );
  
  const now = Date.now();
  const stored = memoryStore.get(key);
  
  // Check if window has expired
  if (!stored || now > stored.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetAt: now + windowMs,
    };
  }
  
  // Check if limit exceeded
  if (stored.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: stored.resetAt,
    };
  }
  
  // Increment count
  stored.count++;
  memoryStore.set(key, stored);
  
  return {
    allowed: true,
    remaining: config.requests - stored.count,
    resetAt: stored.resetAt,
  };
}

/**
 * Production Redis-based rate limiting
 * Uncomment and configure when Redis is available
 */
/*
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function checkRateLimitRedis(
  req: NextRequest,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const pathname = req.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  const key = getRateLimitKey(req, userId);
  
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
  });
  
  const { success, limit, remaining, reset } = await ratelimit.limit(key);
  
  return {
    allowed: success,
    remaining,
    resetAt: reset,
  };
}
*/

/**
 * Clean up expired entries (run periodically in production)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  memoryStore.forEach((value, key) => {
    if (now > value.resetAt) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => memoryStore.delete(key));
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
