-- CMS tables only (idempotent, safe to re-run)
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

-- Mentor Connect notification fields
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "answeredByEmail" TEXT;
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "mentorReminderSentAt" TIMESTAMP(3);
ALTER TABLE "MentorQuestion" ADD COLUMN IF NOT EXISTS "menteeNotifiedAt" TIMESTAMP(3);

-- User mentor/customer separation (admin Mentors vs Customers tabs)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isMentor" BOOLEAN NOT NULL DEFAULT false;

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
