-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONAL operator runbook (2026-09-26 security pass)
--
-- Runtime already applies the safe subset via CORE_MIGRATION_SQL in
-- ensureCoreInfrastructure() / instrumentation.ts:
--   * User.tokenVersion
--   * MentorQuestion.memberShareOptIn (renames legacy isPublic, or adds)
--   * KnowledgeTestResult → User FK as NOT VALID (never deletes, never fails)
--   * KnowledgeTestResult (userId, completedAt) index
--
-- You do NOT need to run this file to deploy. Hand-running it against Neon is
-- not required and should only be done if you specifically want a *validated*
-- FK or the extra indexes below.
--
-- WHAT THIS FILE IS STILL THE ONLY WAY TO DO
--   The runtime FK is NOT VALID: Postgres enforces it for new rows but does
--   not scan existing ones. To fully validate:
--     1. Inspect / delete orphans (STEP 1 — destructive, ask before running).
--     2. VALIDATE CONSTRAINT (STEP 2).
--
-- HOW TO RUN (local snapshot first — never against production without a branch)
--   psql "$DATABASE_URL" -f prisma/manual-migrations-2026-09-26.sql
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — DESTRUCTIVE. Delete orphaned KnowledgeTestResult rows.
--
-- ⚠️  THIS PERMANENTLY DELETES DATA.  ⚠️
--
-- `KnowledgeTestResult` never had a foreign key, so any row whose user has since
-- been deleted is an orphan. VALIDATE CONSTRAINT will refuse while orphans exist.
--
-- RUN THE SELECT FIRST and eyeball the count. If it is non-zero and unexpected,
-- stop and investigate before running the DELETE.
-- ─────────────────────────────────────────────────────────────────────────────

-- Inspect first:
SELECT count(*) AS orphaned_knowledge_test_rows
FROM "KnowledgeTestResult" k
LEFT JOIN "User" u ON u.id = k."userId"
WHERE u.id IS NULL;

-- Then delete (only after you have inspected the count):
-- DELETE FROM "KnowledgeTestResult" k
-- WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = k."userId");


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — Validate the FK that runtime added as NOT VALID.
-- If the constraint is missing (empty DB that never started the app), add it
-- validated after orphans are gone.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "KnowledgeTestResult"
  ADD CONSTRAINT "KnowledgeTestResult_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "KnowledgeTestResult"
  VALIDATE CONSTRAINT "KnowledgeTestResult_userId_fkey";

CREATE INDEX IF NOT EXISTS "KnowledgeTestResult_userId_completedAt_idx"
  ON "KnowledgeTestResult" ("userId", "completedAt");


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — Optional extra indexes (not applied at runtime).
-- Safe and non-destructive. CREATE INDEX takes a write lock; on a small dataset
-- this is instant.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" ("userId");

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");

CREATE INDEX IF NOT EXISTS "MentorQuestion_userId_idx" ON "MentorQuestion" ("userId");

CREATE INDEX IF NOT EXISTS "MentorQuestion_isAnswered_createdAt_idx"
  ON "MentorQuestion" ("isAnswered", "createdAt");


-- ─────────────────────────────────────────────────────────────────────────────
-- STEPS 4–5 from the original file (tokenVersion, isPublic rename) are applied
-- by CORE_MIGRATION_SQL at server start. Re-running them here is unnecessary.
-- ─────────────────────────────────────────────────────────────────────────────
