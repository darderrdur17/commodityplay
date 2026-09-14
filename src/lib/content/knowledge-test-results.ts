/**
 * KnowledgeTestResult.gapAreas is Json. Legacy rows stored a string[] of weak topics.
 * Per-set scores are encoded in the same column so we do not need a schema migration
 * (the table has no testSetId column).
 */

export interface KnowledgeTestStoredResult {
  testSetId: string;
  score: number;
  totalQ: number;
  gapAreas: string[];
  answers: Record<string, number>;
  completedAt?: string;
}

type GapPayload =
  | string[]
  | {
      topics?: unknown;
      testSetId?: unknown;
      answers?: unknown;
    };

export function encodeKnowledgeTestGapAreas(input: {
  testSetId: string;
  answers: Record<string, number>;
  topics: string[];
}): GapPayload {
  return {
    testSetId: input.testSetId,
    topics: input.topics,
    answers: input.answers,
  };
}

export function decodeKnowledgeTestGapAreas(
  gapAreas: unknown,
  fallbackSetId: string
): { testSetId: string; topics: string[]; answers: Record<string, number> } {
  if (Array.isArray(gapAreas)) {
    return {
      testSetId: fallbackSetId,
      topics: gapAreas.filter((t): t is string => typeof t === "string"),
      answers: {},
    };
  }
  if (gapAreas && typeof gapAreas === "object") {
    const raw = gapAreas as {
      topics?: unknown;
      testSetId?: unknown;
      answers?: unknown;
    };
    const answers: Record<string, number> = {};
    if (raw.answers && typeof raw.answers === "object" && !Array.isArray(raw.answers)) {
      for (const [k, v] of Object.entries(raw.answers as Record<string, unknown>)) {
        if (typeof v === "number") answers[k] = v;
      }
    }
    const topics = Array.isArray(raw.topics)
      ? raw.topics.filter((t): t is string => typeof t === "string")
      : [];
    return {
      testSetId: typeof raw.testSetId === "string" && raw.testSetId ? raw.testSetId : fallbackSetId,
      topics,
      answers,
    };
  }
  return { testSetId: fallbackSetId, topics: [], answers: {} };
}

export function latestKnowledgeTestResultsBySet(
  rows: Array<{
    score: number;
    totalQ: number;
    gapAreas: unknown;
    completedAt?: Date | string;
  }>,
  fallbackSetId: string
): Record<string, KnowledgeTestStoredResult> {
  const latest: Record<string, KnowledgeTestStoredResult> = {};
  const sorted = [...rows].sort((a, b) => {
    const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return ta - tb;
  });
  for (const row of sorted) {
    const decoded = decodeKnowledgeTestGapAreas(row.gapAreas, fallbackSetId);
    latest[decoded.testSetId] = {
      testSetId: decoded.testSetId,
      score: row.score,
      totalQ: row.totalQ,
      gapAreas: decoded.topics,
      answers: decoded.answers,
      completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : undefined,
    };
  }
  return latest;
}
