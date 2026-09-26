import "server-only";

import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Sole-administrator access control.
 *
 * The ONE invariant: a caller is an admin if and only if the `email` stored on
 * their `User` row appears in the `ADMIN_EMAILS` allowlist. The `User.role`
 * column is deliberately ignored — it is writable data, not authority, and a
 * `role = 'ADMIN'` row with a non-allowlisted email grants nothing.
 *
 * Everything here is server-only. Never import this from a client component.
 */

/** Minimal identity produced by the allowlist check. */
export interface SoleAdminSession {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Operator inbox used when `ADMIN_EMAILS` is absent outside production, so a
 * fresh checkout still has a working admin surface for local development.
 */
export const DEFAULT_DEV_ADMIN_EMAIL = "francestho@gmail.com";

/** Guard so a missing allowlist logs once per process instead of per request. */
let emptyAllowlistWarned = false;

function warnEmptyAllowlist(reason: string): void {
  if (emptyAllowlistWarned) return;
  emptyAllowlistWarned = true;
  console.error(
    `[admin-access] ${reason} No administrator has access; every admin surface is closed.`
  );
}

/** Trim and lowercase an address so allowlist comparisons are case-insensitive. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Parse `ADMIN_EMAILS` into a de-duplicated, normalised list.
 *
 * Fails closed: in production an unset (or unusable) variable yields an empty
 * list, which denies everybody. Outside production we fall back to
 * {@link DEFAULT_DEV_ADMIN_EMAIL} so local development keeps working.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  const isProduction = process.env.NODE_ENV === "production";

  if (raw === undefined || raw.trim() === "") {
    if (isProduction) {
      warnEmptyAllowlist("ADMIN_EMAILS is unset in production.");
      return [];
    }
    return [DEFAULT_DEV_ADMIN_EMAIL];
  }

  const parsed = Array.from(
    new Set(
      raw
        .split(",")
        .map(normalizeEmail)
        .filter((email) => email.length > 0)
    )
  );

  if (parsed.length === 0) {
    warnEmptyAllowlist("ADMIN_EMAILS is set but contains no usable email addresses.");
    return [];
  }

  return parsed;
}

/** True when `email` (normalised) is on the administrator allowlist. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}

/**
 * Read the current session.
 *
 * Imported lazily because `@/lib/auth` imports `isAdminEmail` back from this
 * module; a static import would create a cycle. The dynamic import keeps the
 * dependency graph acyclic while still returning the live `auth()` binding.
 */
async function readSession(): Promise<{ user?: { id?: string | null } | null } | null> {
  const { auth } = await import("@/lib/auth");
  return auth() as Promise<{ user?: { id?: string | null } | null } | null>;
}

/**
 * Resolve the current caller's allowlisted identity, or `null`.
 *
 * Truth source is the `User.email` column, keyed on the verified
 * `session.user.id` — never on a client-supplied or JWT-cached email.
 */
export async function requireSoleAdmin(): Promise<SoleAdminSession | null> {
  const session = await readSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  let user: { id: string; email: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  } catch (err) {
    console.error("[admin-access] Administrator lookup failed; denying access.", err);
    return null;
  }

  if (!user) return null;
  if (!isAdminEmail(user.email)) return null;

  return { user: { id: user.id, email: user.email } };
}

/** Build the 403 response used by every refused admin API route. */
export function adminForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Route-handler guard. Returns a 403 {@link NextResponse} when the caller is
 * refused, or `null` when allowed.
 *
 * Call sites: `const denied = await assertSoleAdmin(); if (denied) return denied;`
 */
export async function assertSoleAdmin(): Promise<NextResponse | null> {
  const admin = await requireSoleAdmin();
  if (!admin) return adminForbiddenResponse();
  return null;
}

/**
 * Page/layout guard. Calls `notFound()` on refusal so the admin surface reads
 * as a 404 rather than a 403 — a 403 confirms both that the surface exists and
 * that the caller is excluded from it.
 */
export async function requireSoleAdminPage(): Promise<SoleAdminSession> {
  const admin = await requireSoleAdmin();
  if (!admin) notFound();
  return admin;
}

/** Row shape written for every administrator mutation. */
export interface AdminAuditEntry {
  actorEmail: string;
  action: string;
  targetUserId?: string | null;
  /** Must be JSON-serialisable — it is stored in a Postgres `JSONB` column. */
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Append an entry to `AdminAuditLog`.
 *
 * The table is created at runtime by the bundled idempotent migration (see
 * `ensureFeaturesInfrastructure`), so no manual `prisma migrate` is required.
 * A logging failure is reported but never blocks the operation it records.
 */
export async function recordAdminAudit(entry: AdminAuditEntry): Promise<void> {
  try {
    const { ensureFeaturesInfrastructure } = await import("@/lib/setup-database");
    await ensureFeaturesInfrastructure();

    await prisma.adminAuditLog.create({
      data: {
        actorEmail: entry.actorEmail,
        action: entry.action,
        targetUserId: entry.targetUserId ?? null,
        ...(entry.metadata ? { metadata: entry.metadata } : {}),
      },
    });
  } catch (err) {
    console.error("[admin-access] Failed to write AdminAuditLog entry.", err);
  }
}
