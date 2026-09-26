-- ─────────────────────────────────────────────────────────────────────────────
-- CommodityPlay. — manual migration for the 2026-09-26 security pass
--
-- WHY THIS IS MANUAL
--   No database credentials were available during the review, so nothing here
--   has been executed. Prisma's `db push` would apply the schema changes, but
--   step 1 is DESTRUCTIVE and step 4 is a RENAME, and neither should happen
--   unattended on a database with live customer rows.
--
-- HOW TO RUN
--   psql "$DATABASE_URL" -f prisma/manual-migrations-2026-09-26.sql
--   Take a Neon branch / snapshot first. Steps are individually commented so you
--   can run them one at a time and inspect the counts in between.
--
-- ORDER MATTERS. Run top to bottom.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — DESTRUCTIVE. Delete orphaned KnowledgeTestResult rows.
--
-- ⚠️  THIS PERMANENTLY DELETES DATA.  ⚠️
--
-- `KnowledgeTestResult` never had a foreign key, so any row whose user has since
-- been deleted is an orphan. Step 2 adds the FK, and Postgres will refuse to
-- create it while orphans exist. So they have to go first.
--
-- RUN THE SELECT FIRST and eyeball the count. If it is non-zero and unexpected,
-- stop and investigate before running the DELETE.
-- ─────────────────────────────────────────────────────────────────────────────

-- Inspect first:
SELECT count(*) AS orphaned_knowledge_test_rows
FROM "KnowledgeTestResult" k
LEFT JOIN "User" u ON u.id = k."userId"
WHERE u.id IS NULL;

-- Then delete:
DELETE FROM "KnowledgeTestResult" k
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = k."userId");


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — KnowledgeTestResult: add the missing FK and index.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "KnowledgeTestResult"
  ADD CONSTRAINT "KnowledgeTestResult_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "KnowledgeTestResult_userId_completedAt_idx"
  ON "KnowledgeTestResult" ("userId", "completedAt");


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — Missing indexes on hot lookup paths.
-- All of these are safe and non-destructive. CREATE INDEX takes a lock on the
-- table for writes; on a small dataset this is instant.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" ("userId");

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");

CREATE INDEX IF NOT EXISTS "MentorQuestion_userId_idx" ON "MentorQuestion" ("userId");

CREATE INDEX IF NOT EXISTS "MentorQuestion_isAnswered_createdAt_idx"
  ON "MentorQuestion" ("isAnswered", "createdAt");


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — Rename the misleading `isPublic` consent column.
--
-- `MentorQuestion.memberShareOptIn` was stored in a column called `isPublic`.
-- Sitting next to the separate `mentorShareOptIn` (two-party consent), that name
-- invited exactly the wrong reading, and the API accepted both spellings — so a
-- question the member had NOT agreed to share could be published.
--
-- Prisma's schema no longer maps this field, so it expects the column to be
-- named "memberShareOptIn". The rename keeps existing data intact.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "MentorQuestion"
  RENAME COLUMN "isPublic" TO "memberShareOptIn";


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5 — Mobile token revocation counter.
--
-- New column backing `User.tokenVersion`. Existing rows default to 0, which
-- matches the `?? 0` fallback in the token verifier, so tokens issued before
-- this migration stay valid until they expire (max 7 days from issue).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────────

-- Expect 0 orphans:
--   SELECT count(*) FROM "KnowledgeTestResult" k
--   LEFT JOIN "User" u ON u.id = k."userId" WHERE u.id IS NULL;
--
-- Expect the column to be renamed (no "isPublic"):
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'MentorQuestion' ORDER BY column_name;
--
-- Expect tokenVersion present:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'User' AND column_name = 'tokenVersion';
