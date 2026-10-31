/**
 * Rate-limiting primitives that hold no I/O.
 *
 * Deliberately a PLAIN module (no `server-only`, no Prisma, no NextResponse) for
 * the same reason `referral-redemption.ts` is: `src/lib/rate-limit.ts` imports
 * `server-only`, so anything defined there cannot be imported by a verification
 * script. The three things that are easy to get WRONG — the atomic counter SQL,
 * the window→decision mapping, and the fail-closed decision — live here so they
 * can be executed against a real database instead of only string-matched.
 */

export interface RateLimitRule {
  /** Maximum number of hits allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Which store actually produced a result. Surfaced to callers and responses. */
export type RateLimitStore = "redis" | "postgres" | "memory";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the oldest hit leaves the window. 0 when allowed. */
  retryAfterSeconds: number;
  /** Where the count came from. `memory` means NOT shared across instances. */
  store: RateLimitStore;
  /**
   * True only when `store === "memory"`, i.e. the limit is per-instance and the
   * real ceiling is `limit × warm lambdas`. Callers that must not degrade can
   * branch on it.
   */
  degraded?: boolean;
}

export interface RateLimitOptions {
  /**
   * What to do when neither Upstash nor Postgres can count this request.
   *
   * * `"allow"` (default) — keep the historical behaviour: count in memory and
   *   let the request through. Right for login/register/reset, where a slightly
   *   inflated limit is far better than locking everybody out.
   * * `"deny"` — FAIL CLOSED: reject the request. Right where the limit IS the
   *   security control, e.g. referral-code validation.
   */
  onSharedStoreUnavailable?: "allow" | "deny";
}

/**
 * The shared-counter upsert.
 *
 * 🔴 The whole increment must be ONE statement. A read-then-write (SELECT count,
 * then UPDATE count + 1) has exactly the bug the referral single-use indexes were
 * built to avoid: two concurrent lambdas read the same value and both write the
 * same increment, so N concurrent requests count as one. The upsert below
 * increments and resets in place, under the row lock Postgres takes for the
 * conflicting INSERT, so concurrent callers serialize.
 *
 * Window reset is folded into the same statement: if the stored window has
 * already elapsed, the count restarts at 1 and `expiresAt` is pushed forward.
 */
export const PG_WINDOW_SQL = `
INSERT INTO "RateLimitCounter" ("key", "count", "expiresAt")
VALUES ($1, 1, NOW() + ($2::text || ' seconds')::interval)
ON CONFLICT ("key") DO UPDATE SET
  "count" = CASE
              WHEN "RateLimitCounter"."expiresAt" <= NOW() THEN 1
              ELSE "RateLimitCounter"."count" + 1
            END,
  "expiresAt" = CASE
                  WHEN "RateLimitCounter"."expiresAt" <= NOW()
                    THEN NOW() + ($2::text || ' seconds')::interval
                  ELSE "RateLimitCounter"."expiresAt"
                END
RETURNING
  "count"::int AS "count",
  GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - NOW()))))::int AS "ttl"
`;

/**
 * Map a counter reading to an allow/deny decision.
 *
 * `count` counts the CURRENT call, so `limit: 5` permits exactly five: the sixth
 * reading is `6 > 5` and is denied. `remaining` therefore never goes negative.
 */
export function windowResult(
  count: number,
  ttlSeconds: number,
  rule: RateLimitRule,
  store: RateLimitStore
): RateLimitResult {
  const ttl = Number.isFinite(ttlSeconds) ? Math.max(1, Math.floor(ttlSeconds)) : 1;

  if (count > rule.limit) {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfterSeconds: ttl,
      store,
    };
  }

  return {
    allowed: true,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: 0,
    store,
  };
}

/**
 * The decision when no shared store could count the request.
 *
 * `"deny"` is the fail-closed branch, and it is the entire point of the option:
 * a limit of `20 × warm lambdas` is not a limit of 20, so a surface whose cap IS
 * its security control must refuse rather than pretend.
 *
 * `degraded: true` is set in BOTH cases, because the caller needs to tell
 * "you have tried too often" (429) apart from "I cannot check right now" (503).
 * Reporting 429 for the second would be a lie about the member's behaviour.
 */
export function degradedResult(
  rule: RateLimitRule,
  onSharedStoreUnavailable: RateLimitOptions["onSharedStoreUnavailable"] = "allow"
): RateLimitResult {
  if (onSharedStoreUnavailable === "deny") {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfterSeconds: 60,
      store: "memory",
      degraded: true,
    };
  }

  return {
    allowed: true,
    limit: rule.limit,
    // Nothing was actually counted, so report the honest worst case.
    remaining: 0,
    retryAfterSeconds: 0,
    store: "memory",
    degraded: true,
  };
}
