import { prisma } from "@/lib/prisma";
import { seedDatabase } from "../../prisma/seed";
import {
  CMS_MIGRATION_SQL,
  CORE_MIGRATION_SQL,
  FEATURES_MIGRATION_SQL,
} from "./db-schema-migrations";

function stripSqlComments(sql: string): string {
  return sql.replace(/--[^\n\r]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseSqlStatements(sql: string): string[] {
  const cleaned = stripSqlComments(sql);
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "$" && cleaned[i + 1] === "$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
      continue;
    }
    if (!inDollarQuote && cleaned[i] === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      continue;
    }
    current += cleaned[i];
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);
  return statements;
}

function isIgnorableDbError(err: unknown): boolean {
  const msg = String(err);
  return (
    msg.includes("already exists") ||
    msg.includes("duplicate key") ||
    msg.includes("42P07") ||
    msg.includes("42710")
  );
}

async function runMigrationSql(sql: string): Promise<void> {
  const statements = parseSqlStatements(sql);
  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err) {
      if (!isIgnorableDbError(err)) throw err;
    }
  }
}

export async function applyCmsSchemaSql(): Promise<void> {
  await runMigrationSql(CMS_MIGRATION_SQL);
}

export async function applyFeaturesSchemaSql(): Promise<void> {
  await runMigrationSql(FEATURES_MIGRATION_SQL);
}

export async function applyCoreSchemaSql(): Promise<void> {
  await runMigrationSql(CORE_MIGRATION_SQL);
}

let coreSchemaReady = false;

/**
 * Reconcile the security-critical columns and constraints
 * (`User.tokenVersion`, `MentorQuestion.memberShareOptIn`, the
 * `KnowledgeTestResult` foreign key).
 *
 * This is the safety net that lets the 2026-09-26 security commit deploy without
 * anyone hand-running `prisma/manual-migrations-2026-09-26.sql` first. The SQL it
 * runs is additive, idempotent and tolerant — see `CORE_MIGRATION_SQL` for the
 * full rationale.
 *
 * Cached per lambda so the cost after the first call is a single boolean check.
 *
 * FAILURE POLICY — deliberately non-fatal.
 *   A best-effort repair must never be able to break something that already
 *   works. If this threw, a migration problem (an unreachable database, or a role
 *   without ALTER rights) would take down content, mentor and admin paths that
 *   were previously fine. So a failure is logged and swallowed: the request then
 *   proceeds and, if the column really is missing, fails on its own query with
 *   the precise Postgres error — which is strictly more informative than a
 *   generic bootstrap failure.
 *
 *   The ready-flag is only set on success, so a transient failure is retried on
 *   the next call rather than disabling the repair for the lambda's lifetime.
 */
export async function ensureCoreInfrastructure(): Promise<void> {
  if (coreSchemaReady) return;
  try {
    await applyCoreSchemaSql();
    coreSchemaReady = true;
  } catch (err) {
    console.error(
      "[setup-database] core schema reconciliation failed; will retry on next call:",
      err
    );
  }
}

let featuresTablesReady = false;

/** Auto-create feature tables on first API use (mirrors CMS bootstrap). */
export async function ensureFeaturesInfrastructure(): Promise<void> {
  if (featuresTablesReady) return;
  await ensureCoreInfrastructure();
  await applyFeaturesSchemaSql();
  featuresTablesReady = true;
}


export async function ensureJobChatInfrastructure(): Promise<void> {
  await ensureFeaturesInfrastructure();
}

export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const admin = await prisma.user.findUnique({ where: { email: "admin@demo.com" } });
    return Boolean(admin);
  } catch {
    return false;
  }
}

/**
 * Remove the shared demo password from every seeded demo inbox.
 *
 * `seedDatabase()` writes `Demo1234!` onto all `@demo.com` accounts. That is
 * fine for local work, but in production those rows are a live bypass if the
 * login gate is ever bypassed — and the gate is only a `NODE_ENV` check.
 *
 * Deleting the *hash* rather than the account is deliberate: the row survives
 * (so `isDatabaseSeeded()` and the demo catalogue keep working) but the account
 * can no longer authenticate. This is the code equivalent of
 * `prisma/neutralize-demo-accounts.sql`, run automatically so a future
 * `POST /api/setup-db` cannot silently re-arm the credentials.
 *
 * @returns the number of accounts that had a password removed.
 */
export async function neutralizeDemoPasswords(): Promise<number> {
  const { count } = await prisma.user.updateMany({
    where: { email: { endsWith: "@demo.com" }, passwordHash: { not: null } },
    data: { passwordHash: null },
  });
  return count;
}

export async function setupProductionDatabase(): Promise<{ alreadySeeded: boolean; demoPasswordsCleared: number }> {
  await applyCoreSchemaSql();
  await applyCmsSchemaSql();
  await applyFeaturesSchemaSql();

  const alreadySeeded = await isDatabaseSeeded();
  await seedDatabase();

  // Re-seeding just re-armed every demo password. In production, disarm them
  // again immediately, in the same request, so there is no window where a
  // public credential works.
  const { isProductionRuntime } = await import("@/lib/demo-guard");
  const demoPasswordsCleared = isProductionRuntime() ? await neutralizeDemoPasswords() : 0;

  return { alreadySeeded, demoPasswordsCleared };
}
