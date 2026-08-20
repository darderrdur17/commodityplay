import { prisma } from "@/lib/prisma";
import { seedDatabase } from "../../prisma/seed";
import { CMS_MIGRATION_SQL, FEATURES_MIGRATION_SQL } from "./db-schema-migrations";

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

export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const admin = await prisma.user.findUnique({ where: { email: "admin@demo.com" } });
    return Boolean(admin);
  } catch {
    return false;
  }
}

export async function setupProductionDatabase(): Promise<{ alreadySeeded: boolean }> {
  await applyCmsSchemaSql();
  await applyFeaturesSchemaSql();

  const alreadySeeded = await isDatabaseSeeded();
  await seedDatabase();
  return { alreadySeeded };
}
