import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_CODE_MAX_LENGTH,
  generateReferralCode,
  isAcceptableCustomReferralCode,
  normalizeReferralCode,
} from "@/lib/referral-codes";

/**
 * `GET/POST /api/admin/referral-codes` — the admin "Referral codes" tab.
 *
 * Both handlers are gated by `requireSoleAdmin()` (the `ADMIN_EMAILS` allowlist,
 * NOT `User.role`) and answer 403 on refusal.
 *
 * 🔴 Nothing here talks to Stripe. Codes are just rows; the discount they unlock
 * is an existing coupon the owner created in the Stripe Dashboard, referenced by
 * `STRIPE_REFERRAL_COUPON_ID`.
 */

const createSchema = z.object({
  /** Optional. When absent a random `CP-XXXX-XXXX` code is generated. */
  code: z.string().max(REFERRAL_CODE_MAX_LENGTH).optional(),
  label: z.string().max(120).optional(),
  /**
   * `rewardKind` / `rewardValue` are RECORD-KEEPING ONLY. The reward has not been
   * decided yet, and the discount that is actually applied comes from the Stripe
   * coupon named by `STRIPE_REFERRAL_COUPON_ID` — never from these columns, and
   * never from a value typed into this form. They exist so the intent is captured
   * alongside the code and can be honoured later.
   */
  rewardKind: z.string().max(40).optional(),
  rewardValue: z.number().int().min(0).max(100).nullable().optional(),
  /** ISO date string, or null to clear. */
  expiresAt: z.string().datetime().nullable().optional(),
});

/** How many times to retry a generated code that collides with an existing row. */
const GENERATE_ATTEMPTS = 5;

/**
 * Page size bounds for the list endpoint.
 *
 * 🔴 The list used to be `findMany()` with no `take` and a nested
 * `redemption → user` on every row, i.e. the whole table plus a join per row in
 * one response. That is fine at ten codes and untenable at ten thousand: the
 * response grows without bound and the admin tab has to render all of it.
 *
 * `MAX_PAGE_SIZE` is a hard cap, not a hint — a caller asking for 10000 gets 100.
 */
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const requestedPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const requestedSize = Number.parseInt(
    url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
    10
  );

  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isFinite(requestedSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize))
    : DEFAULT_PAGE_SIZE;

  try {
    const total = await prisma.referralCode.count();

    // Clamp so a stale page number (e.g. after deleting the last row on the last
    // page) returns the final page instead of an empty table that looks like data
    // loss.
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    // 🔴 Step 1: the codes, bounded. No relation is included here — a nested
    // include is what made this a per-row join.
    const codes = await prisma.referralCode.findMany({
      // 🔴 `id` is the TIEBREAKER, not decoration. Codes generated in the same
      // millisecond share a `createdAt`, and `ORDER BY createdAt DESC` alone leaves
      // their relative order unspecified — so offset pagination could show one row
      // on two pages and skip another. The second key makes the order total.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        label: true,
        rewardKind: true,
        rewardValue: true,
        expiresAt: true,
        disabled: true,
        createdAt: true,
      },
    });

    const codeIds = codes.map((row) => row.id);

    // Step 2: ONE batched query for this page's redemptions. A code has at most
    // one redemption (unique index), so this returns ≤ pageSize rows.
    const redemptions = codeIds.length
      ? await prisma.referralRedemption.findMany({
          where: { referralCodeId: { in: codeIds } },
          select: {
            referralCodeId: true,
            status: true,
            reservedAt: true,
            confirmedAt: true,
            stripeSessionId: true,
            userId: true,
          },
        })
      : [];

    // Step 3: ONE batched query for the members those redemptions point at —
    // only the fields the table renders, and only for ids actually referenced.
    const userIds = [...new Set(redemptions.map((row) => row.userId))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        })
      : [];

    const userById = new Map(users.map((user) => [user.id, user]));
    const redemptionByCodeId = new Map(
      redemptions.map((redemption) => [redemption.referralCodeId, redemption])
    );

    // Step 4: stitch in memory. Same shape the tab already consumes, so the UI's
    // `row.redemption.user.email` keeps working unchanged.
    const items = codes.map((row) => {
      const redemption = redemptionByCodeId.get(row.id) ?? null;
      const user = redemption ? userById.get(redemption.userId) : null;

      return {
        ...row,
        redemption:
          redemption && user
            ? {
                status: redemption.status,
                reservedAt: redemption.reservedAt,
                confirmedAt: redemption.confirmedAt,
                stripeSessionId: redemption.stripeSessionId,
                user: { id: user.id, email: user.email, name: user.name },
              }
            : null,
      };
    });

    return NextResponse.json({
      items,
      page: safePage,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("[admin/referral-codes] list failed", err);
    return NextResponse.json({ error: "Could not load referral codes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // An empty body is legitimate: "Generate code" posts `{}`.
    body = {};
  }

  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid referral code" },
      { status: 400 }
    );
  }

  const { label, rewardKind, rewardValue, expiresAt } = parsed.data;

  // A custom code is optional. When supplied it is normalised and checked against
  // the SAME character set the generator uses, so no code can ever be stored in a
  // shape `normalizeReferralCode()` would rewrite on lookup.
  let customCode: string | null = null;
  if (parsed.data.code && parsed.data.code.trim().length > 0) {
    const normalized = normalizeReferralCode(parsed.data.code);
    if (!isAcceptableCustomReferralCode(normalized)) {
      return NextResponse.json(
        {
          error:
            "A custom code must be 3–32 characters of A–Z, 0–9 or hyphens, and may not start or end with a hyphen.",
        },
        { status: 400 }
      );
    }
    customCode = normalized;
  }

  const data = {
    label: label?.trim() || null,
    ...(rewardKind ? { rewardKind } : {}),
    ...(rewardValue !== undefined ? { rewardValue } : {}),
    ...(expiresAt !== undefined
      ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
      : {}),
    createdById: admin.user.id,
  };

  try {
    if (customCode) {
      let created: { id: string; code: string };
      try {
        created = await prisma.referralCode.create({
          data: { ...data, code: customCode },
          select: { id: true, code: true },
        });
      } catch (err) {
        // A hand-typed code that already exists is an operator mistake, not a
        // server fault — say so instead of returning a generic 500.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return NextResponse.json(
            { error: `The code ${customCode} already exists.` },
            { status: 409 }
          );
        }
        throw err;
      }

      await recordAdminAudit({
        actorEmail: admin.user.email,
        action: "referral.create",
        metadata: { referralCodeId: created.id, code: created.code, custom: true },
      });

      return NextResponse.json(created, { status: 201 });
    }

    // Generated codes: retry on the astronomically unlikely unique collision
    // rather than trusting randomness. Anything else propagates.
    for (let attempt = 0; attempt < GENERATE_ATTEMPTS; attempt++) {
      try {
        const created = await prisma.referralCode.create({
          data: { ...data, code: generateReferralCode() },
          select: { id: true, code: true },
        });

        await recordAdminAudit({
          actorEmail: admin.user.email,
          action: "referral.create",
          metadata: { referralCodeId: created.id, code: created.code, custom: false },
        });

        return NextResponse.json(created, { status: 201 });
      } catch (err) {
        const collision =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!collision || attempt === GENERATE_ATTEMPTS - 1) throw err;
      }
    }

    // Unreachable: the loop either returns or throws.
    return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
  } catch (err) {
    console.error("[admin/referral-codes] create failed", err);
    return NextResponse.json({ error: "Could not create referral code" }, { status: 500 });
  }
}
