import "server-only";

import { NextResponse } from "next/server";

/**
 * Fixed-window rate limiting for unauthenticated (and a few paid) endpoints.
 *
 * Prefer Upstash Redis when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are set so every Vercel instance shares one
 * counter. When those vars are absent (or Redis errors), fall back to the
 * in-process Map so local builds and previews still run.
 */

export interface RateLimitRule {
  /** Maximum number of hits allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the oldest hit leaves the window. 0 when allowed. */
  retryAfterSeconds: number;
}

/** Rules per surface. Keys are the call-site identifiers used below. */
export const RATE_LIMITS = {
  /** Credentials sign-in, web and mobile: 5 attempts / 15 min per (ip + email). */
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  /**
   * Password-reset requests: 3 per day per email.
   *
   * Every accepted POST fires a Resend email, so without this the endpoint is a
   * free email-bombing primitive aimed at any address.
   */
  forgotPassword: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
  /** Reset submission: 5 / 15 min per ip. */
  resetPassword: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Account creation: 5 / 15 min per ip. */
  register: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Stripe Checkout session creation: 8 / 15 min per member. */
  stripeCheckout: { limit: 8, windowMs: 15 * 60 * 1000 },
  /**
   * Stripe webhook deliveries. Generous so legitimate retries are not dropped;
   * still bounds a forged-flood if the signing secret were ever leaked.
   */
  stripeWebhook: { limit: 120, windowMs: 60 * 1000 },
  /** setup-db POST: 5 per hour per IP. */
  setupDb: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;

const buckets = new Map<string, number[]>();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_TRACKED_BUCKETS = 10_000;
let lastSweepAt = 0;
let vercelFallbackWarned = false;

type RedisIncrClient = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  ttl: (key: string) => Promise<number>;
};

let redisClient: RedisIncrClient | null | undefined;

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function warnVercelFallback(reason: string): void {
  if (process.env.VERCEL !== "1" || vercelFallbackWarned) return;
  vercelFallbackWarned = true;
  console.warn(`[rate-limit] ${reason} Falling back to in-memory counters.`);
}

async function getRedis(): Promise<RedisIncrClient | null> {
  if (redisClient !== undefined) return redisClient;
  if (!redisConfigured()) {
    warnVercelFallback("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset on Vercel.");
    redisClient = null;
    return null;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = Redis.fromEnv();
    return redisClient;
  } catch (err) {
    console.error("[rate-limit] Failed to initialise Upstash Redis.", err);
    warnVercelFallback("Upstash client failed to load.");
    redisClient = null;
    return null;
  }
}

function sweep(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  const widest = Math.max(...Object.values(RATE_LIMITS).map((rule) => rule.windowMs));
  for (const [key, hits] of buckets) {
    const live = hits.filter((at) => now - at < widest);
    if (live.length === 0) buckets.delete(key);
    else buckets.set(key, live);
  }
  if (buckets.size > MAX_TRACKED_BUCKETS) buckets.clear();
}

function checkMemory(key: string, rule: RateLimitRule, now: number): RateLimitResult {
  sweep(now);
  const hits = (buckets.get(key) ?? []).filter((at) => now - at < rule.windowMs);

  if (hits.length >= rule.limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    const retryAfterMs = rule.windowMs - (now - oldest);
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  return {
    allowed: true,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - hits.length),
    retryAfterSeconds: 0,
  };
}

async function checkRedis(
  redis: RedisIncrClient,
  key: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(rule.windowMs / 1000));
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }
  const ttl = await redis.ttl(redisKey);
  const retryAfterSeconds = ttl > 0 ? ttl : windowSec;

  if (count > rule.limit) {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  return {
    allowed: true,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: 0,
  };
}

/**
 * Record an attempt against `key` and report whether it is allowed.
 *
 * Counts the current call, so `limit: 5` permits exactly five attempts.
 */
export async function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now()
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (redis) {
    try {
      return await checkRedis(redis, key, rule);
    } catch (err) {
      console.error("[rate-limit] Redis increment failed; using in-memory fallback.", err);
      warnVercelFallback("Upstash increment failed.");
    }
  }
  return checkMemory(key, rule, now);
}

/**
 * Alternate shape used by some call sites / docs.
 * `{ success, remaining, reset }` maps onto {@link checkRateLimit}.
 */
export async function rateLimit(
  identifier: string,
  opts: { limit: number; windowSec: number }
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await checkRateLimit(identifier, {
    limit: opts.limit,
    windowMs: opts.windowSec * 1000,
  });
  return {
    success: result.allowed,
    remaining: result.remaining,
    reset: result.retryAfterSeconds,
  };
}

export function getClientIp(req: Request): string {
  // Vercel appends the real connecting IP at the end of x-forwarded-for and
  // also exposes it directly. Prefer these over the first entry, which a
  // client can forge.
  const vercelIp = req.headers.get("x-vercel-ip");
  if (vercelIp) return vercelIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    // The last entry is the one appended by the closest proxy (Vercel edge).
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitKey(scope: string, ...parts: string[]): string {
  return [scope, ...parts.map((part) => part.trim().toLowerCase())].join(":");
}

export function rateLimitResponse(
  result: RateLimitResult,
  message = "Too many attempts. Please try again later."
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
