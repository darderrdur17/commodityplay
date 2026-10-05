import { NextRequest, NextResponse } from "next/server";
import { assertSoleAdmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { applyCmsSchemaSql } from "@/lib/setup-database";

/**
 * How much settled Q&A history the admin panel loads, in months.
 *
 * This route is platform-wide, so unlike the per-mentor inbox it genuinely grows
 * with total volume. The window is the bound — deliberately NOT a `take`, because
 * the list is ordered purely by recency and a cap could therefore silently drop
 * an old *unanswered* question from the review queue. Instead the window keeps
 * everything the admin can still act on at any age:
 *
 *   - every unanswered question, and
 *   - every Desk Channel item still awaiting a publish/reject decision,
 *
 * and trims only questions that are answered *and* already resolved.
 *
 * The admin client derives its "All / Pending / Answered" tab counts from the
 * returned array, so this window is also what keeps those counts meaningful:
 * they are counts of the review window, not of the entire table.
 */
const ADMIN_QA_HISTORY_MONTHS = 18;

export async function GET(req: NextRequest) {
  const denied = await assertSoleAdmin();
  if (denied) return denied;

  await applyCmsSchemaSql();

  const status = req.nextUrl.searchParams.get("status") ?? "all";

  const where =
    status === "pending"
      ? { isAnswered: false }
      : status === "answered"
        ? { isAnswered: true }
        : status === "queue"
          ? {
              isAnswered: true,
              memberShareOptIn: true,
              mentorShareOptIn: true,
              deskChannelStatus: "none",
            }
          : {};

  const historySince = new Date();
  historySince.setMonth(historySince.getMonth() - ADMIN_QA_HISTORY_MONTHS);

  const questions = await prisma.mentorQuestion.findMany({
    where: {
      ...where,
      // Recent history, plus anything the admin can still act on regardless of
      // age. Combined with the `status` filter above via AND, so the `queue` and
      // `pending` views keep returning everything they returned before.
      OR: [
        { createdAt: { gte: historySince } },
        { isAnswered: false },
        {
          isAnswered: true,
          memberShareOptIn: true,
          mentorShareOptIn: true,
          deskChannelStatus: "none",
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, tier: true } },
    },
  });

  return NextResponse.json(questions);
}
