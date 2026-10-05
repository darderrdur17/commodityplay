import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** A mentor profile an admin can preview. */
export interface MentorPreviewOption {
  mentorProfileId: string;
  name: string;
  email: string;
}

/**
 * Mentor profiles an admin can preview — every account actually linked to a
 * Mentor Connect profile.
 *
 * A profile with no linked account has no inbox to render, so it is excluded
 * rather than listed as an empty option.
 */
export async function listMentorPreviewOptions(): Promise<MentorPreviewOption[]> {
  const rows = await prisma.user.findMany({
    where: { isMentor: true, mentorProfileId: { not: null } },
    select: { name: true, email: true, mentorProfileId: true },
    orderBy: { mentorProfileId: "asc" },
  });

  return rows.flatMap((row) =>
    row.mentorProfileId
      ? [
          {
            mentorProfileId: row.mentorProfileId,
            name: row.name ?? row.email ?? row.mentorProfileId,
            email: row.email ?? "",
          },
        ]
      : []
  );
}

/**
 * The questions a mentor is allowed to see in their own inbox.
 *
 * Two arms, and the reason for each:
 *
 *  - `mentorProfileId` — questions a member explicitly addressed to this mentor's
 *    anonymous profile (per-mentor targeting).
 *  - `answeredByEmail` — questions this mentor personally answered.
 *
 * The second arm is what restores a mentor's pre-targeting history. Every question
 * asked before per-mentor targeting existed carries `mentorProfileId = NULL`, so
 * without it a mentor loses sight of work they actually did — and their reward
 * ladder, which counts by `answeredByEmail`, visibly disagrees with their inbox.
 *
 * Deliberately NOT included: unaddressed questions this mentor never answered.
 * Nothing records who those were meant for, so showing them would hand one
 * member's question to every mentor on the platform.
 *
 * ⚠️ Never widen this to `{ mentorProfileId: null }`. In Prisma that matches every
 * row whose column IS NULL — i.e. exactly the questions we must not leak. The
 * profile arm is therefore only added when a profile id is actually present.
 *
 * A mentor is not guaranteed to have a profile link: `isMentorAccount` accepts the
 * `isMentor` flag or the demo email, and `mentor-profile-sync` can clear the link.
 */
export function mentorInboxWhere(mentor: {
  mentorProfileId?: string | null;
  email?: string | null;
}): Prisma.MentorQuestionWhereInput {
  const arms: Prisma.MentorQuestionWhereInput[] = [];

  if (mentor.mentorProfileId) {
    arms.push({ mentorProfileId: mentor.mentorProfileId });
  }

  if (mentor.email) {
    arms.push({ answeredByEmail: { equals: mentor.email, mode: "insensitive" } });
  }

  // Neither a profile link nor an email — this mentor can see nothing. An empty
  // `OR` would match every row, so return an explicitly empty set instead.
  if (arms.length === 0) return { id: { in: [] } };

  return { OR: arms };
}

/** The minimum a caller must know about a mentor to act on their behalf. */
export interface MentorInboxSubject {
  id: string;
  email?: string | null;
  mentorProfileId?: string | null;
}

/**
 * Load a question **only if it sits inside this mentor's inbox** — the single
 * sanctioned way for a write path to reach a question.
 *
 * `PATCH /api/mentor-connect/inbox/[id]` previously looked the row up by id
 * alone, and that was exploitable two ways:
 *
 *  - a mentor could answer a question addressed to a *different* mentor. The
 *    answer was attributed to their own email, which is not in the other
 *    mentor's scope, so the write landed outside that mentor's inbox: the row
 *    changed while their queue looked untouched;
 *  - it let an admin write straight through the read-only inbox preview. A
 *    disabled button is not an authorization control.
 *
 * Applying the scope at the call site fixed both, but left the invariant
 * opt-in — the next person to add a write path could reach for `findUnique`
 * again. Funnelling the lookup through here removes that choice: there is no
 * unscoped lookup left to reach for.
 *
 * Returns `null` when the question is missing, outside the mentor's inbox, or
 * was asked by this mentor themselves as a member.
 */
export async function findAnswerableMentorQuestion(
  mentor: MentorInboxSubject,
  questionId: string
): Promise<{ id: string; userId: string } | null> {
  const question = await prisma.mentorQuestion.findFirst({
    where: { AND: [{ id: questionId }, mentorInboxWhere(mentor)] },
    select: { id: true, userId: true },
  });
  if (!question) return null;

  // A mentor must not answer a question they asked themselves as a member.
  if (question.userId === mentor.id) return null;

  return question;
}
