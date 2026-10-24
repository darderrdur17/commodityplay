import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAudit, requireSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

/**
 * `PATCH/DELETE /api/admin/referral-codes/[id]`.
 *
 * PATCH edits a code's bookkeeping only — `disabled`, `label`, `expiresAt`. The
 * `code` string itself is immutable: it has already been shared with members, so
 * "editing" it would silently invalidate every message it was sent in.
 *
 * DELETE is refused while a redemption exists. That is deliberate: the redemption
 * row is the audit trail of who received a discount, and cascading it away would
 * destroy the only record that a code was ever honoured. Disable it instead.
 */

const patchSchema = z.object({
  disabled: z.boolean().optional(),
  label: z.string().max(120).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid update" },
      { status: 400 }
    );
  }

  const { disabled, label, expiresAt } = parsed.data;
  if (disabled === undefined && label === undefined && expiresAt === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.referralCode.update({
      where: { id },
      data: {
        ...(disabled !== undefined ? { disabled } : {}),
        ...(label !== undefined ? { label: label?.trim() || null } : {}),
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
      select: { id: true, code: true, disabled: true, label: true, expiresAt: true },
    });

    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "referral.update",
      metadata: {
        referralCodeId: updated.id,
        code: updated.code,
        disabled: updated.disabled,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }
    console.error("[admin/referral-codes] update failed", err);
    return NextResponse.json({ error: "Could not update referral code" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSoleAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const existing = await prisma.referralCode.findUnique({
      where: { id },
      select: { id: true, code: true, redemption: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }

    // Keep the audit trail. A code that has been used is evidence, not clutter.
    if (existing.redemption) {
      return NextResponse.json(
        {
          error:
            "This code has already been redeemed, so it cannot be deleted — the redemption is part of the audit trail. Disable it instead.",
        },
        { status: 409 }
      );
    }

    await prisma.referralCode.delete({ where: { id } });

    await recordAdminAudit({
      actorEmail: admin.user.email,
      action: "referral.delete",
      metadata: { referralCodeId: existing.id, code: existing.code },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/referral-codes] delete failed", err);
    return NextResponse.json({ error: "Could not delete referral code" }, { status: 500 });
  }
}
