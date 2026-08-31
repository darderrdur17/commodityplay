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
`;
