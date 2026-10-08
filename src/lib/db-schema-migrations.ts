/**
 * Idempotent SQL migrations bundled in the serverless function (no prisma/ files on Vercel).
 * Keep in sync with prisma/schema.prisma when adding tables.
 */

export const CMS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS "ContentModule" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredTier" "Tier" NOT NULL DEFAULT 'STARTER',
    "payload" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentModule_slug_key" ON "ContentModule"("slug");
CREATE INDEX IF NOT EXISTS "ContentModule_slug_idx" ON "ContentModule"("slug");
CREATE INDEX IF NOT EXISTS "ContentModule_requiredTier_idx" ON "ContentModule"("requiredTier");

CREATE TABLE IF NOT EXISTS "ContentAsset" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "moduleSlug" TEXT,
    "assetKey" TEXT,
    "requiredTier" "Tier" NOT NULL DEFAULT 'PRO',
    "label" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentAsset_assetKey_key" ON "ContentAsset"("assetKey");
CREATE INDEX IF NOT EXISTS "ContentAsset_moduleSlug_idx" ON "ContentAsset"("moduleSlug");

DO $$ BEGIN
  ALTER TABLE "ContentModule" ADD CONSTRAINT "ContentModule_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "answeredByEmail" TEXT;
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "mentorReminderSentAt" TIMESTAMP(3);
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "menteeNotifiedAt" TIMESTAMP(3);
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "mentorShareOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "deskChannelStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "deskChannelQaId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profession" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isMentor" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resumePersonaDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mentorProfileId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_mentorProfileId_key" ON "User"("mentorProfileId") WHERE "mentorProfileId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "DemoEmailLog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemoEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DemoEmailLog_createdAt_idx" ON "DemoEmailLog"("createdAt");

CREATE TABLE IF NOT EXISTS "ContentModuleRevision" (
    "id" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "requiredTier" "Tier" NOT NULL,
    "published" BOOLEAN NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentModuleRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContentModuleRevision_moduleSlug_version_key"
  ON "ContentModuleRevision"("moduleSlug", "version");
CREATE INDEX IF NOT EXISTS "ContentModuleRevision_moduleSlug_version_idx"
  ON "ContentModuleRevision"("moduleSlug", "version");

DO $$ BEGIN
  ALTER TABLE "ContentModuleRevision" ADD CONSTRAINT "ContentModuleRevision_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

export const FEATURES_MIGRATION_SQL = `
DO $$ BEGIN
  CREATE TYPE "PrepCategory" AS ENUM ('MARKET_MECHANICS', 'CURRENT_EVENT', 'RISK_PRICING', 'LOGISTICS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE_DISCUSSION', 'FIRST_CONTACT', 'STALLED', 'RESEARCHING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BookmarkSource" AS ENUM ('PREP_LIBRARY', 'MARKET_NUDGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TalkingPoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "track" "Track" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "category" "PrepCategory" NOT NULL,
    "keyPoints" TEXT[],
    "source" TEXT,
    "prepStatus" TEXT NOT NULL DEFAULT 'Learning it',
    "usedInNote" TEXT,
    "canUseFor" TEXT,
    CONSTRAINT "TalkingPoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TalkingPoint_userId_idx" ON "TalkingPoint"("userId");
CREATE INDEX IF NOT EXISTS "TalkingPoint_userId_track_idx" ON "TalkingPoint"("userId", "track");

DO $$ BEGIN
  ALTER TABLE "TalkingPoint" ADD CONSTRAINT "TalkingPoint_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'TalkingPoint' AND column_name = 'prepStatus'
      AND udt_name = 'PrepStatus'
  ) THEN
    ALTER TABLE "TalkingPoint" ALTER COLUMN "prepStatus" TYPE TEXT USING (
      CASE "prepStatus"::text
        WHEN 'LEARNING_IT' THEN 'Learning it'
        WHEN 'INTERVIEW_READY' THEN 'Interview-ready'
        WHEN 'USED_IT' THEN 'Used it'
        ELSE "prepStatus"::text
      END
    );
    ALTER TABLE "TalkingPoint" ALTER COLUMN "prepStatus" SET DEFAULT 'Learning it';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TrackedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deskType" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL,
    "notes" TEXT,
    "lastTouch" TEXT,
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackedAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TrackedAccount_userId_idx" ON "TrackedAccount"("userId");

DO $$ BEGIN
  ALTER TABLE "TrackedAccount" ADD CONSTRAINT "TrackedAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AccountBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sourceType" "BookmarkSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountBookmark_userId_accountId_sourceType_sourceId_key"
  ON "AccountBookmark"("userId", "accountId", "sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "AccountBookmark_userId_idx" ON "AccountBookmark"("userId");
CREATE INDEX IF NOT EXISTS "AccountBookmark_accountId_idx" ON "AccountBookmark"("accountId");

DO $$ BEGIN
  ALTER TABLE "AccountBookmark" ADD CONSTRAINT "AccountBookmark_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "TrackedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AccountBookmark" ADD CONSTRAINT "AccountBookmark_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "JobChatThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "hirerEmail" TEXT NOT NULL,
    "hirerName" TEXT,
    "hirerToken" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "exchangeCount" INTEGER NOT NULL DEFAULT 0,
    "interviewOffered" BOOLEAN NOT NULL DEFAULT false,
    "interviewOfferedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobChatThread_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JobChatThread_hirerToken_key" ON "JobChatThread"("hirerToken");
CREATE UNIQUE INDEX IF NOT EXISTS "JobChatThread_userId_jobId_key" ON "JobChatThread"("userId", "jobId");
CREATE INDEX IF NOT EXISTS "JobChatThread_hirerToken_idx" ON "JobChatThread"("hirerToken");
CREATE INDEX IF NOT EXISTS "JobChatThread_jobId_idx" ON "JobChatThread"("jobId");

DO $$ BEGIN
  ALTER TABLE "JobChatThread" ADD CONSTRAINT "JobChatThread_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UserMarketNudgeStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMarketNudgeStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserMarketNudgeStatus_userId_kind_sourceId_key"
  ON "UserMarketNudgeStatus"("userId", "kind", "sourceId");
CREATE INDEX IF NOT EXISTS "UserMarketNudgeStatus_userId_idx" ON "UserMarketNudgeStatus"("userId");

DO $$ BEGIN
  ALTER TABLE "UserMarketNudgeStatus" ADD CONSTRAINT "UserMarketNudgeStatus_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorEmail_idx" ON "AdminAuditLog"("actorEmail");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog"("targetUserId");
`;

/**
 * Core schema reconciliation for the 2026-09-26 security pass.
 *
 * WHY THIS EXISTS
 *   This project has no `prisma/migrations/` directory, and nothing in the build
 *   or deploy pipeline runs `prisma migrate deploy` or `prisma db push`. Schema
 *   changes were previously applied by hand, which means a deploy could ship
 *   code that references a column the database does not have yet.
 *
 *   That is exactly what the security commit did: `User.tokenVersion` and
 *   `MentorQuestion.memberShareOptIn` are referenced by the new code, but the
 *   other migration strings only ever added `mentorShareOptIn` (a different,
 *   pre-existing column) and `AdminAuditLog`. Deploying without the manual SQL
 *   would therefore break sign-in: Prisma's default `select` returns every
 *   scalar field, so `prisma.user.findUnique({ where: { email } })` in the
 *   credentials provider emits `"tokenVersion"` and fails with
 *   `column "tokenVersion" does not exist`.
 *
 * DESIGN RULES — a migration that runs inside a request handler must never be
 * able to fail and must never destroy data:
 *   1. Additive only. Nothing is dropped or truncated.
 *   2. Idempotent. Safe to run on every cold start, and safe to run
 *      concurrently from two lambdas.
 *   3. Tolerant. If a prerequisite is missing (e.g. a brand-new empty database
 *      where `User` does not exist yet) the statement no-ops instead of
 *      throwing and 500-ing the request.
 *
 * The companion file `prisma/manual-migrations-2026-09-26.sql` is optional for
 * deploy. It is still the only path to a *validated* FK: inspect/delete
 * orphaned `KnowledgeTestResult` rows, then `VALIDATE CONSTRAINT`. This
 * runtime version uses `NOT VALID` so it can never fail on pre-existing orphans.
 */
export const CORE_MIGRATION_SQL = `
-- 1. User.tokenVersion — mobile JWT revocation counter.
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 1b. User.mentorRevokedAt — mentor access revocation marker (set on profile delete or
--     an explicit admin revoke; cleared on restore). This lives in CORE, not the CMS
--     block: ensureCoreInfrastructure() runs this on every cold start / request path,
--     whereas the CMS block only executes at CMS bootstrap, so a column added there
--     after the first deploy would never be created on a live database.
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mentorRevokedAt" TIMESTAMP(3);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 1c. MentorQuestion.mentorProfileId — the anonymous Mentor Connect profile the
--     member addressed (e.g. "PT-01"). Mentor inboxes filter on this column.
--     Null means the question predates per-mentor targeting, so it is hidden
--     from mentors (admins still see it). CORE, not CMS, for the same reason as 1b.
DO $$ BEGIN
  ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "mentorProfileId" TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 2. MentorQuestion.memberShareOptIn — member consent for desk-channel publication.
--    This field was historically mapped onto a column literally named "isPublic".
--    If the legacy column is still present we RENAME it, which preserves consent
--    members have already given. Otherwise we ADD the column. The guard means a
--    database that has neither column (a fresh one) still ends up correct.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'MentorQuestion'
      AND column_name = 'memberShareOptIn'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'MentorQuestion'
        AND column_name = 'isPublic'
    ) THEN
      ALTER TABLE "MentorQuestion" RENAME COLUMN "isPublic" TO "memberShareOptIn";
    ELSE
      ALTER TABLE "MentorQuestion" ADD COLUMN "memberShareOptIn" BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 3. KnowledgeTestResult -> User foreign key.
--    This model previously had no relation at all, so deleting a user left their
--    quiz rows behind forever (a GDPR erasure gap). It also means orphan rows can
--    already exist, which would make a plain ADD CONSTRAINT fail and abort the
--    whole migration.
--    NOT VALID is the deliberate choice here: Postgres enforces the constraint
--    for every new INSERT/UPDATE immediately, but does not scan existing rows.
--    So it can never fail and never has to delete anything. To fully validate it
--    later, clean the orphans and run:
--      ALTER TABLE "KnowledgeTestResult" VALIDATE CONSTRAINT "KnowledgeTestResult_userId_fkey";
DO $$ BEGIN
  ALTER TABLE "KnowledgeTestResult" ADD CONSTRAINT "KnowledgeTestResult_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "KnowledgeTestResult_userId_completedAt_idx"
    ON "KnowledgeTestResult" ("userId", "completedAt");
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. Contact Us submissions. The Prisma model existed, but this table was never
--    in CORE/CMS/FEATURES SQL, so hosted Neon 42P01'd on prisma.contactMessage.create.
CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- 5. Marketing + terms consent on User (PR3). Additive, idempotent, tolerant of an
--    empty database where "User" does not exist yet. CORE, not CMS, for the same
--    reason as tokenVersion: ensureCoreInfrastructure() runs on every cold start /
--    request path, so a column added here after the first deploy is created on a
--    live database; the CMS block only runs at CMS bootstrap.
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingConsentAt" TIMESTAMP(3);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
`
