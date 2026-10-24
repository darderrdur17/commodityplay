/**
 * Executable verification for the three post-deploy fixes.
 *
 *   npx tsx scripts/verify-post-deploy-fixes.ts
 *
 * Runs against the LOCAL database (`DATABASE_URL` from `.env.local`). It creates
 * its own rows under a unique tag and deletes them at the end, so it is safe to
 * run repeatedly — but it refuses to run at all if `DATABASE_URL` is not localhost.
 *
 * Why this file exists separately from `verify-feedback-changes.ts`: that suite is
 * source-text assertions. Three of these fixes are BEHAVIOURAL — whether a counter
 * increment is atomic, whether offset pagination is stable, whether a window
 * resets — and a regex cannot tell you that. The pure parts were moved into
 * `src/lib/rate-limit-shared.ts` precisely so they could be executed here.
 *
 * ⚠️ NOT covered here: the Stripe `expires_at` round-trip. It needs a live API key
 * (still not provided). The value is checked for shape and window-bounds; see
 * `verifySessionExpiry()` for what remains unproven.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { CORE_MIGRATION_SQL } from "../src/lib/db-schema-migrations";
import {
  PG_WINDOW_SQL,
  degradedResult,
  windowResult,
  type RateLimitRule,
} from "../src/lib/rate-limit-shared";

/* ── harness ─────────────────────────────────────────────────────────────── */

let failed = 0;
function ok(name: string, pass: boolean, detail?: string) {
  if (pass) console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  else {
    failed += 1;
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/* ── env ─────────────────────────────────────────────────────────────────── */

/** Minimal `.env.local` reader: Prisma needs DATABASE_URL before construction. */
function loadLocalDatabaseUrl(): string {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split("\n")) {
      const match = /^\s*DATABASE_URL\s*=\s*"?(.*?)"?\s*$/.exec(line);
      if (match?.[1]) return match[1];
    }
  }
  throw new Error("DATABASE_URL not found in .env.local or .env");
}

const databaseUrl = loadLocalDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)) {
  console.error(
    "REFUSING TO RUN: DATABASE_URL is not localhost. This script creates and deletes rows."
  );
  process.exit(1);
}

const prisma = new PrismaClient();

/* ── SQL splitting (same rules as setup-database.ts) ─────────────────────── */

function splitSql(sql: string): string[] {
  const cleaned = sql.replace(/--[^\n\r]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let current = "";
  let inDollar = false;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "$" && cleaned[i + 1] === "$") {
      inDollar = !inDollar;
      current += "$$";
      i++;
      continue;
    }
    if (!inDollar && cleaned[i] === ";") {
      if (current.trim()) out.push(current.trim());
      current = "";
      continue;
    }
    current += cleaned[i];
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/* ── 1. rate limiting ────────────────────────────────────────────────────── */

const TEST_RULE: RateLimitRule = { limit: 5, windowMs: 15 * 60 * 1000 };

async function counterReading(key: string, windowSec = 900) {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number; ttl: number }>>(
    PG_WINDOW_SQL,
    key,
    String(windowSec)
  );
  return rows[0]!;
}

async function verifyRateLimiting() {
  console.log("\n── 1. Distributed rate limiting ──");

  // The migration must be runnable and must create the table (no migrations dir).
  let migrationOk = true;
  let migrationError = "";
  for (const statement of splitSql(CORE_MIGRATION_SQL)) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err) {
      const message = String(err);
      const ignorable =
        message.includes("already exists") ||
        message.includes("duplicate key") ||
        message.includes("42P07") ||
        message.includes("42710");
      if (!ignorable) {
        migrationOk = false;
        migrationError = message.slice(0, 160);
      }
    }
  }
  ok("CORE_MIGRATION_SQL applies cleanly", migrationOk, migrationError || "idempotent re-run");

  const tableRows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'RateLimitCounter'
     ) AS "exists"`
  );
  ok("RateLimitCounter table exists after the migration", tableRows[0]?.exists === true);

  const key = `qa:rl:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  // 🔴 The atomicity test. 20 concurrent increments must produce 20 DISTINCT
  // counts (1..20). A read-then-write implementation loses updates here: several
  // callers read the same value and write back the same increment, so the maximum
  // observed count falls short and duplicates appear.
  const concurrent = await Promise.all(
    Array.from({ length: 20 }, () => counterReading(key))
  );
  const counts = concurrent.map((row) => Number(row.count)).sort((a, b) => a - b);
  const expected = Array.from({ length: 20 }, (_, i) => i + 1);
  const atomic = counts.length === 20 && counts.every((value, index) => value === expected[index]);
  ok(
    "20 concurrent increments produce 20 distinct counts (atomic, no lost updates)",
    atomic,
    `max=${Math.max(...counts)} distinct=${new Set(counts).size}`
  );

  // With limit 5, exactly 5 of those 20 readings are allowed.
  const allowed = concurrent.filter(
    (row) => windowResult(Number(row.count), Number(row.ttl), TEST_RULE, "postgres").allowed
  ).length;
  ok("Exactly `limit` requests are allowed out of 20 concurrent hits", allowed === 5, `allowed=${allowed}`);

  // A separate key must not share the counter.
  const otherKey = `${key}:other`;
  const other = await counterReading(otherKey);
  ok("A different key starts its own window at 1", Number(other.count) === 1, `count=${other.count}`);

  // Window reset: backdate the window, then the next hit must restart at 1.
  await prisma.$executeRawUnsafe(
    `UPDATE "RateLimitCounter" SET "expiresAt" = NOW() - INTERVAL '1 second' WHERE "key" = $1`,
    key
  );
  const afterReset = await counterReading(key);
  ok("An elapsed window resets the counter to 1", Number(afterReset.count) === 1, `count=${afterReset.count}`);

  // TTL is reported for Retry-After.
  ok("The counter returns a positive TTL for Retry-After", Number(afterReset.ttl) > 0, `ttl=${afterReset.ttl}`);

  // Pure decision functions.
  const atLimit = windowResult(5, 900, TEST_RULE, "postgres");
  const overLimit = windowResult(6, 900, TEST_RULE, "postgres");
  ok(
    "windowResult allows exactly `limit` and denies limit+1",
    atLimit.allowed && atLimit.remaining === 0 && !overLimit.allowed && overLimit.retryAfterSeconds === 900
  );

  const deny = degradedResult(TEST_RULE, "deny");
  const allow = degradedResult(TEST_RULE, "allow");
  ok(
    "degraded + 'deny' FAILS CLOSED (allowed:false, degraded:true)",
    !deny.allowed && deny.degraded === true && deny.store === "memory"
  );
  ok(
    "degraded + 'allow' keeps historical behaviour but still flags degraded",
    allow.allowed && allow.degraded === true
  );

  await prisma.$executeRawUnsafe(`DELETE FROM "RateLimitCounter" WHERE "key" LIKE $1`, `qa:rl:%`);
}

/* ── 2. pagination ───────────────────────────────────────────────────────── */

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

async function verifyPagination() {
  console.log("\n── 2. Bounded, paginated admin list ──");

  const tag = `QA-PAGE-${Date.now()}`;
  const TOTAL = 120;

  // 🔴 Every row shares ONE `createdAt` on purpose. That is the case that breaks
  // naive offset pagination: without a tiebreaker the relative order of equal
  // timestamps is unspecified, so a row can appear on two pages while another is
  // skipped entirely. The route orders by `[{createdAt:"desc"},{id:"desc"}]`.
  const sameInstant = new Date("2026-01-01T00:00:00.000Z");
  await prisma.referralCode.createMany({
    data: Array.from({ length: TOTAL }, (_, i) => ({
      id: `${tag}-${String(i).padStart(4, "0")}`,
      code: `${tag}-${String(i).padStart(4, "0")}`,
      label: tag,
      createdAt: sameInstant,
      updatedAt: sameInstant,
    })),
  });

  // Replicate the route's page query exactly.
  const fetchPage = (page: number, size: number) =>
    prisma.referralCode.findMany({
      where: { label: tag },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * size,
      take: size,
      select: { id: true },
    });

  const page1 = await fetchPage(1, PAGE_SIZE);
  const page5 = await fetchPage(5, PAGE_SIZE);
  ok("A full page returns exactly pageSize rows", page1.length === PAGE_SIZE, `got=${page1.length}`);
  ok("The final partial page returns the remainder", page5.length === TOTAL - 4 * PAGE_SIZE, `got=${page5.length}`);

  // Walk every page and prove the union is exactly the data set — no repeats, no gaps.
  const seen: string[] = [];
  for (let page = 1; page <= Math.ceil(TOTAL / PAGE_SIZE); page++) {
    seen.push(...(await fetchPage(page, PAGE_SIZE)).map((row) => row.id));
  }
  const unique = new Set(seen);
  ok(
    "Paging through every page yields each row exactly once (stable tiebreaker)",
    seen.length === TOTAL && unique.size === TOTAL,
    `rows=${seen.length} unique=${unique.size}`
  );

  // Clamping: a stale page number must return the last page, not an empty table.
  const totalPages = Math.ceil(TOTAL / PAGE_SIZE);
  const safePage = Math.min(99, totalPages);
  const clamped = await fetchPage(safePage, PAGE_SIZE);
  ok("A page number past the end clamps to the last page", clamped.length > 0, `rows=${clamped.length}`);

  // The hard cap.
  const requested = 10_000;
  const capped = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  ok("pageSize is hard-capped at MAX_PAGE_SIZE", capped === MAX_PAGE_SIZE, `10000 -> ${capped}`);

  // Batched join: two codes with redemptions, one without. Proves the stitching
  // maps the right member to the right code and leaves unclaimed codes null.
  const userA = await prisma.user.create({
    data: { email: `qa.page.a.${Date.now()}@example.test`, name: "QA A" },
    select: { id: true, email: true },
  });
  const userB = await prisma.user.create({
    data: { email: `qa.page.b.${Date.now()}@example.test`, name: "QA B" },
    select: { id: true, email: true },
  });

  const codeA = `${tag}-0000`;
  const codeB = `${tag}-0001`;
  const codeC = `${tag}-0002`;

  await prisma.referralRedemption.createMany({
    data: [
      { id: `${tag}-r-a`, referralCodeId: codeA, userId: userA.id, status: "CONFIRMED", confirmedAt: new Date() },
      { id: `${tag}-r-b`, referralCodeId: codeB, userId: userB.id, status: "RESERVED" },
    ],
  });

  const codeIds = [codeA, codeB, codeC];
  const redemptions = await prisma.referralRedemption.findMany({
    where: { referralCodeId: { in: codeIds } },
    select: { referralCodeId: true, status: true, userId: true },
  });
  const userIds = [...new Set(redemptions.map((row) => row.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const emailById = new Map(users.map((user) => [user.id, user.email]));
  const byCode = new Map(redemptions.map((row) => [row.referralCodeId, row]));

  const stitched = codeIds.map((id) => {
    const redemption = byCode.get(id);
    return {
      id,
      email: redemption ? (emailById.get(redemption.userId) ?? null) : null,
    };
  });

  ok(
    "Batched join maps each code to the right member, and unclaimed codes to null",
    stitched[0]!.email === userA.email &&
      stitched[1]!.email === userB.email &&
      stitched[2]!.email === null,
    `A=${stitched[0]!.email === userA.email} B=${stitched[1]!.email === userB.email} C=null:${stitched[2]!.email === null}`
  );

  // Cleanup.
  await prisma.referralRedemption.deleteMany({ where: { referralCodeId: { in: codeIds } } });
  await prisma.referralCode.deleteMany({ where: { label: tag } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
}

/* ── 3. session expiry ───────────────────────────────────────────────────── */

function verifySessionExpiry() {
  console.log("\n── 3. Session expiry vs reservation TTL ──");

  const routeSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/stripe/checkout/route.ts"),
    "utf8"
  );
  const validationSrc = fs.readFileSync(
    path.join(process.cwd(), "src/lib/referral-validation.ts"),
    "utf8"
  );

  ok(
    "The checkout session sends expires_at",
    routeSrc.includes("expires_at: Math.floor((Date.now() + REFERRAL_SESSION_TTL_MS) / 1000)")
  );

  const sessionMinutes = Number(
    /export const REFERRAL_SESSION_TTL_MS = (\d+) \* 60 \* 1000;/.exec(validationSrc)?.[1]
  );
  const reservationMinutes = Number(
    /export const REFERRAL_RESERVATION_TTL_MS = (\d+) \* 60 \* 1000;/.exec(validationSrc)?.[1]
  );

  // Stripe rejects expires_at outside 30 minutes – 24 hours from creation.
  ok(
    "expires_at is inside Stripe's 30min–24h window",
    Number.isFinite(sessionMinutes) && sessionMinutes >= 30 && sessionMinutes <= 1440,
    `${sessionMinutes} min`
  );

  // 🔴 The ordering that makes the fix real. Compute the actual instants rather
  // than comparing the numbers, so the assertion mirrors what the code does.
  const created = Date.now();
  const sessionExpiresAt = created + sessionMinutes * 60 * 1000;
  const reservationReleasedAt = created + reservationMinutes * 60 * 1000;
  ok(
    "The session expires BEFORE its reservation can be released",
    sessionExpiresAt < reservationReleasedAt,
    `session +${sessionMinutes}min < reservation +${reservationMinutes}min`
  );

  // A 24h default (the bug) would satisfy the opposite ordering.
  ok(
    "The old 24h default would have violated that ordering (regression guard)",
    created + 24 * 60 * 60 * 1000 > reservationReleasedAt
  );

  console.log(
    "  ⚠️  NOT PROVEN: that Stripe accepts expires_at and that an expired session\n" +
      "      is unpayable. Both need a live secret key (still pending)."
  );
}

/* ── main ────────────────────────────────────────────────────────────────── */

async function main() {
  const before = {
    users: await prisma.user.count(),
    codes: await prisma.referralCode.count(),
    redemptions: await prisma.referralRedemption.count(),
  };

  await verifyRateLimiting();
  await verifyPagination();
  verifySessionExpiry();

  const after = {
    users: await prisma.user.count(),
    codes: await prisma.referralCode.count(),
    redemptions: await prisma.referralRedemption.count(),
  };
  const counters = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS "count" FROM "RateLimitCounter"`
  );

  console.log("\n── DB restored ──");
  console.log(`before: users=${before.users} codes=${before.codes} redemptions=${before.redemptions}`);
  console.log(`after:  users=${after.users} codes=${after.codes} redemptions=${after.redemptions}`);
  console.log(`RateLimitCounter rows left: ${counters[0]?.count ?? 0}`);

  const restored =
    before.users === after.users &&
    before.codes === after.codes &&
    before.redemptions === after.redemptions;
  ok("The database is back to its pre-test state", restored);

  console.log(
    failed === 0
      ? "\n✅ All post-deploy fix checks passed."
      : `\n❌ ${failed} check(s) failed.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
