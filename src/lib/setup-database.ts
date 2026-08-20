import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "../../prisma/seed";

/** Apply full Prisma schema to the connected database (Neon production). */
export async function applyPrismaSchema(): Promise<void> {
  execSync("npx prisma db push --skip-generate", {
    stdio: "pipe",
    env: process.env,
  });
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
  await applyPrismaSchema();

  const alreadySeeded = await isDatabaseSeeded();
  await seedDatabase();
  return { alreadySeeded };
}
