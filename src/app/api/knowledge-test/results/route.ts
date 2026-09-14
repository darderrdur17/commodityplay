import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProSession } from "@/lib/prep-library-auth";
import { DEFAULT_KNOWLEDGE_TEST_SET_ID } from "@/lib/content/knowledge-test-payload";
import {
  encodeKnowledgeTestGapAreas,
  latestKnowledgeTestResultsBySet,
} from "@/lib/content/knowledge-test-results";

const postSchema = z.object({
  testSetId: z.string().min(1).max(120),
  score: z.number().int().min(0).max(500),
  totalQ: z.number().int().min(1).max(500),
  gapAreas: z.array(z.string()).max(100),
  answers: z.record(z.string(), z.number()).optional(),
});

export async function GET() {
  const gate = await requireProSession();
  if ("error" in gate) return gate.error;

  const rows = await prisma.knowledgeTestResult.findMany({
    where: { userId: gate.user.id },
    orderBy: { completedAt: "asc" },
  });

  const bySet = latestKnowledgeTestResultsBySet(rows, DEFAULT_KNOWLEDGE_TEST_SET_ID);
  return NextResponse.json({ results: bySet });
}

export async function POST(req: NextRequest) {
  const gate = await requireProSession();
  if ("error" in gate) return gate.error;

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid knowledge test result" }, { status: 400 });
  }

  const { testSetId, score, totalQ, gapAreas, answers } = parsed.data;
  const row = await prisma.knowledgeTestResult.create({
    data: {
      userId: gate.user.id,
      score,
      totalQ,
      gapAreas: encodeKnowledgeTestGapAreas({
        testSetId,
        answers: answers ?? {},
        topics: gapAreas,
      }) as object,
    },
  });

  return NextResponse.json({
    ok: true,
    testSetId,
    score: row.score,
    totalQ: row.totalQ,
  });
}
