/**
 * Push latest content from repo into Neon CMS during Vercel build.
 *
 * Local builds without DATABASE_URL still skip (so `npm run build` works offline).
 * On Vercel, a missing DATABASE_URL is a hard failure — shipping without CMS sync
 * would silently serve stale or empty modules.
 * A set-but-unreachable URL is retried with backoff so a transient Neon blip
 * does not fail the deploy.
 */
import { syncAllContentModulesFromDefaults } from "../src/lib/content/repository";
import { syncContentAssetsFromRepo } from "../src/lib/content/content-asset-seed";
import { syncResumeTemplateAssets } from "../src/lib/content/resume-template-seed";

const RETRY_ATTEMPTS = 5;
const BASE_DELAY_MS = 500;

function isTransientDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
  return /P1001|P1002|P1017|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET|EAI_AGAIN|timeout|Can't reach|unreachable|Connection refused|server closed/i.test(
    `${code} ${message}`
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientDbError(err) || attempt === RETRY_ATTEMPTS) {
        throw err;
      }
      const delay = Math.min(8_000, BASE_DELAY_MS * 2 ** (attempt - 1));
      console.warn(
        `[sync-cms] ${label} failed (attempt ${attempt}/${RETRY_ATTEMPTS}); retrying in ${delay}ms —`,
        err instanceof Error ? err.message : err
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    if (process.env.VERCEL === "1") {
      console.error(
        "[sync-cms] DATABASE_URL is unset on Vercel. Refusing to ship a silently empty CMS."
      );
      process.exit(1);
    }
    console.log("[sync-cms] DATABASE_URL not set — skipping CMS sync (local build OK).");
    return;
  }

  const modules = await withRetry("content modules", () => syncAllContentModulesFromDefaults());
  console.log(
    `[sync-cms] Content modules synced: ${modules.total} (${modules.created} created, ${modules.updated} updated, ${modules.unchanged} unchanged)`
  );

  const assets = await withRetry("content assets", () => syncContentAssetsFromRepo());
  console.log(
    `[sync-cms] Download assets: ${assets.total} expected, ${assets.syncedFromRepo} from repo, ${assets.placeholders} placeholders, ${assets.skipped} unchanged`
  );

  const resumes = await withRetry("resume templates", () => syncResumeTemplateAssets());
  console.log(
    `[sync-cms] Resume templates synced: ${resumes.synced}/${resumes.total}${resumes.missing ? ` (${resumes.missing} missing files)` : ""}`
  );
}

main()
  .catch((err) => {
    console.error("[sync-cms] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
