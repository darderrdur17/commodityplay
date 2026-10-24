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

export async function GET() {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const codes = await prisma.referralCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        label: true,
        rewardKind: true,
        rewardValue: true,
        expiresAt: true,
        disabled: true,
        createdAt: true,
        // A code has at most one redemption (unique index), so this is 1:1.
        // The member's email is included because the operator needs to know WHO
        // used a code — that is the whole point of the audit trail.
        redemption: {
          select: {
            status: true,
            reservedAt: true,
            confirmedAt: true,
            stripeSessionId: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(codes);
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
