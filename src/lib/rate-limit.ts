import "server-only";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PG_WINDOW_SQL,
  degradedResult,
  windowResult,
  type RateLimitOptions,
  type RateLimitResult,
  type RateLimitRule,
  type RateLimitStore,
} from "@/lib/rate-limit-shared";

/**
 * Fixed-window rate limiting for unauthenticated (and a few paid) endpoints.
 *
 * THREE tiers, in order of preference, and the order is the point:
 *
 *   1. **Upstash Redis** (`UPSTASH_REDIS_REST_URL` + `_TOKEN`) — one counter for
 *      every Vercel instance. Fastest and the intended production store.
 *   2. **Postgres** (`RateLimitCounter`) — used when Upstash is absent. Every
 *      lambda already reaches the database, so one atomic upsert gives a real
 *      distributed limit. Slower than Redis, still CORRECT.
 *   3. **In-process Map** — last resort only. Per-instance, so it silently
 *      multiplies every limit by the number of warm lambdas.
 *
 * ⚠️ Tier 3 is a lie about the limit, which is why it is no longer silent. Every
 * result carries the `store` that produced it, `warnDegraded()` says so once in
 * the logs, and a call site that cannot tolerate an inflated limit can pass
 * `onSharedStoreUnavailable: "deny"` to FAIL CLOSED instead. `referralValidate`
 * does exactly that: its 20-per-15-minutes cap exists to stop referral-code
 * guessing, and a cap of 20 × N lambdas is not that cap.
 *
 * History: before Postgres was added, Upstash being unset meant tier 3 in
 * production, so `referralValidate` was effectively unbounded per code space.
 *
 * The counter SQL and the two decision functions live in `rate-limit-shared.ts`
 * (a plain module) so a verification script can execute them against a real
 * database — this file cannot be imported outside Next because of `server-only`.
 */

export type { RateLimitOptions, RateLimitResult, RateLimitRule, RateLimitStore };

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
   * Referral-code validation: 20 / 15 min per member.
   *
   * A member types one code, maybe mistypes it twice. The cap exists so the
   * endpoint is not a free oracle for guessing codes: `CP-XXXX-XXXX` has ~1.1e12
   * combinations, so 20 tries per quarter hour is nowhere near enough to walk it.
   */
  referralValidate: { limit: 20, windowMs: 15 * 60 * 1000 },
  /**
   * Stripe webhook deliveries. Generous so legitimate retries are not dropped;
   * still bounds a forged-flood if the signing secret were ever leaked.
   */
  stripeWebhook: { limit: 120, windowMs: 60 * 1000 },
  /** setup-db POST: 5 per hour per IP. */
  setupDb: { limit: 5, windowMs: 60 * 60 * 1000 },
  /**
   * Contact form: 5 per hour per IP.
   *
   * Every accepted POST writes a `ContactMessage`, upserts an `EmailSubscriber` AND
   * sends one operator email, so without a cap the endpoint is a free email-bombing
   * primitive aimed at the operator's own inbox. A real visitor sends one message.
   */
  contactMessage: { limit: 5, windowMs: 60 * 60 * 1000 },
  /**
   * Public lead-capture forms (newsletter, job-board waitlist, Starter Pack lead):
   * 10 per hour per IP.
   *
   * These are lower-harm than `contactMessage` — they only write rows — but they are
   * still unauthenticated and were previously unbounded. 10/hour is comfortably above
   * any human pattern (one signup, maybe a correction) and caps automated fill.
   */
  leadCapture: { limit: 10, windowMs: 60 * 60 * 1000 },
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

/**
 * Say, ONCE per lambda, that the limit in force is not the limit configured.
 *
 * The old message ("Falling back to in-memory counters") was true but told nobody
 * what it cost. This one names the multiplier, because "20 per 15 minutes" and
 * "20 per 15 minutes per warm lambda" are different security properties and the
 * difference is invisible from the outside.
 */
function warnDegraded(reason: string): void {
  if (process.env.VERCEL !== "1" || vercelFallbackWarned) return;
  vercelFallbackWarned = true;
  console.warn(
    `[rate-limit] DEGRADED: no shared counter store (${reason}). ` +
      "Counting in this instance's memory only, so every limit is effectively " +
      "multiplied by the number of warm lambdas. Set UPSTASH_REDIS_REST_URL and " +
      "UPSTASH_REDIS_REST_TOKEN to make limits exact, or ensure the " +
      "RateLimitCounter table exists so the Postgres store can be used."
  );
}

async function getRedis(): Promise<RedisIncrClient | null> {
  if (redisClient !== undefined) return redisClient;
  if (!redisConfigured()) {
    redisClient = null;
    return null;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = Redis.fromEnv();
    return redisClient;
  } catch (err) {
    console.error("[rate-limit] Failed to initialise Upstash Redis.", err);
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
      store: "memory",
      degraded: true,
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  return {
    allowed: true,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - hits.length),
    retryAfterSeconds: 0,
    store: "memory",
    degraded: true,
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
      store: "redis",
    };
  }

  return {
    allowed: true,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: 0,
    store: "redis",
  };
}

/* ── Postgres store ───────────────────────────────────────────────────────────
 * The shared counter used when Upstash is absent. Every lambda reaches the same
 * database, so this is a REAL distributed limit rather than a per-instance one.
 *
 * The upsert itself (`PG_WINDOW_SQL`) lives in `rate-limit-shared.ts` so it can be
 * executed by a verification script — see the note at the top of this file.
 */
const DB_SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastDbSweepAt = 0;
let counterTableReady = false;

function isMissingCounterTable(err: unknown): boolean {
  const message = String(err);
  return (
    message.includes("42P01") ||
    message.toLowerCase().includes('relation "ratelimitcounter" does not exist')
  );
}

/**
 * Create the counter table if it is somehow missing.
 *
 * Normally `src/instrumentation.ts` has already run `CORE_MIGRATION_SQL` on cold
 * start, so this never fires. It exists for the ordering case where a rate-limited
 * request is the very first thing to touch a brand-new database.
 */
async function ensureCounterTable(): Promise<void> {
  const { applyCoreSchemaSql } = await import("@/lib/setup-database");
  await applyCoreSchemaSql();
  counterTableReady = true;
}

/** Best-effort cleanup so the table cannot grow without bound. */
async function sweepPostgres(now: number): Promise<void> {
  if (now - lastDbSweepAt < DB_SWEEP_INTERVAL_MS) return;
  lastDbSweepAt = now;
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "RateLimitCounter" WHERE "expiresAt" < NOW() - INTERVAL '1 hour'`
    );
  } catch {
    // Housekeeping must never affect a request.
  }
}

/**
 * Count this hit in Postgres.
 *
 * @returns the result, or `null` when the store is unusable — the caller then
 *   decides whether to degrade (in-memory) or fail closed.
 */
async function checkPostgres(
  key: string,
  rule: RateLimitRule,
  now: number
): Promise<RateLimitResult | null> {
  const windowSec = Math.max(1, Math.ceil(rule.windowMs / 1000));

  const run = async () =>
    prisma.$queryRawUnsafe<Array<{ count: number; ttl: number }>>(
      PG_WINDOW_SQL,
      key,
      String(windowSec)
    );

  try {
    let rows: Array<{ count: number; ttl: number }>;
    try {
      rows = await run();
    } catch (err) {
      // A brand-new database may not have the table yet. Create it once, retry.
      if (!counterTableReady && isMissingCounterTable(err)) {
        await ensureCounterTable();
        rows = await run();
      } else {
        throw err;
      }
    }

    const row = rows[0];
    if (!row) return null;

    void sweepPostgres(now);

    return windowResult(Number(row.count), Number(row.ttl), rule, "postgres");
  } catch (err) {
    console.error("[rate-limit] Postgres counter unavailable.", err);
    return null;
  }
}

/**
 * Record an attempt against `key` and report whether it is allowed.
 *
 * Counts the current call, so `limit: 5` permits exactly five attempts.
 *
 * Store preference is Redis → Postgres → memory. The `store` field on the result
 * says which one answered, so a caller never has to guess whether its limit was
 * real. Pass `onSharedStoreUnavailable: "deny"` to fail closed instead of
 * accepting an inflated per-instance limit.
 */
export async function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (redis) {
    try {
      return await checkRedis(redis, key, rule);
    } catch (err) {
      console.error("[rate-limit] Redis increment failed; trying Postgres.", err);
    }
  }

  // Shared store #2. This is what makes the limit real in production today.
  const postgres = await checkPostgres(key, rule, now);
  if (postgres) return postgres;

  // Neither shared store answered. This is the degraded path.
  if (options.onSharedStoreUnavailable === "deny") {
    // FAIL CLOSED. Reports `allowed: false` AND `degraded: true` so the call site
    // can answer 503 ("cannot check right now") rather than 429 ("you have tried
    // too often") — they are different facts and the member deserves the accurate
    // one. The decision itself is pure, so it is pinned in rate-limit-shared.ts.
    return degradedResult(rule, "deny");
  }

  warnDegraded(
    redisConfigured() ? "Redis and Postgres both failed" : "Upstash unset and Postgres failed"
  );
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
        // Which store enforced the limit. `memory` means it was per-instance, so
        // the limit in force is `limit × warm lambdas` rather than `limit`.
        "X-RateLimit-Store": result.store,
      },
    }
  );
}

/**
 * The answer when the limit could not be checked at all and the call site chose
 * to fail closed.
 *
 * 503, not 429: nothing was exceeded. The service simply cannot decide right now,
 * and telling a member "too many attempts" when they made one would be false.
 */
export function rateLimitUnavailableResponse(
  result: RateLimitResult,
  message = "This is temporarily unavailable. Please try again in a moment."
): NextResponse {
  return NextResponse.json(
    { error: message, reason: "RATE_LIMIT_UNAVAILABLE" },
    {
      status: 503,
      headers: {
        "Retry-After": String(Math.max(1, result.retryAfterSeconds)),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Store": result.store,
      },
    }
  );
}
