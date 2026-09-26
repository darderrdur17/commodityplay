import "server-only";

import { NextResponse } from "next/server";

/**
 * Coarse fixed-window rate limiting for the unauthenticated auth endpoints.
 *
 * ⚠️  LIMITATION — READ BEFORE RELYING ON THIS
 * The counters live in a plain in-process `Map`. On a single long-lived Node
 * process that is real enforcement. On Vercel the app runs as many independent
 * lambda instances (and instances are recycled freely), so each one keeps its
 * own counters and a caller can get roughly `limit × instanceCount` attempts.
 * This raises the cost of abuse; it does NOT hard-caps it.
 *
 * For actual enforcement this Map must be swapped for a shared durable store
 * (Upstash Redis / Vercel KV) behind the same `checkRateLimit` signature. Do not
 * describe the current behaviour as airtight.
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
} as const satisfies Record<string, RateLimitRule>;

/** hit timestamps (epoch ms) per bucket key. */
const buckets = new Map<string, number[]>();

/** Drop buckets that have gone quiet so the Map cannot grow without bound. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_TRACKED_BUCKETS = 10_000;
let lastSweepAt = 0;

function sweep(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  const widest = Math.max(
    RATE_LIMITS.login.windowMs,
    RATE_LIMITS.forgotPassword.windowMs,
    RATE_LIMITS.resetPassword.windowMs,
    RATE_LIMITS.register.windowMs
  );
  for (const [key, hits] of buckets) {
    const live = hits.filter((at) => now - at < widest);
    if (live.length === 0) buckets.delete(key);
    else buckets.set(key, live);
  }
  // Hard ceiling as a last resort against a memory-exhaustion vector.
  if (buckets.size > MAX_TRACKED_BUCKETS) buckets.clear();
}

/**
 * Record an attempt against `key` and report whether it is allowed.
 *
 * Counts the current call, so `limit: 5` permits exactly five attempts.
 */
export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now()
): RateLimitResult {
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

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is set by the hosting platform; it is only trustworthy when
 * the app is genuinely behind that proxy (Vercel is). A caller reaching the
 * origin directly could spoof it, which is one more reason the shared-store
 * upgrade matters.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Stable bucket key. `scope` separates surfaces that share an email. */
export function rateLimitKey(scope: string, ...parts: string[]): string {
  return [scope, ...parts.map((part) => part.trim().toLowerCase())].join(":");
}

/** 429 response carrying standard `Retry-After`. */
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
