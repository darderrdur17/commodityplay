import { KNOWLEDGE_TEST, type KnowledgeQuestion } from "@/data/knowledge-test";

export interface KnowledgeTestSet {
  id: string;
  label: string;
  questions: KnowledgeQuestion[];
}

export interface KnowledgeTestPayload {
  /** @deprecated Legacy flat list — migrated to testSets on read */
  questions?: KnowledgeQuestion[];
  testSets?: KnowledgeTestSet[];
  activeTestSetId?: string;
}

export const DEFAULT_KNOWLEDGE_TEST_SET_ID = "default";

export function createDefaultKnowledgeTestPayload(): KnowledgeTestPayload {
  return {
    testSets: [
      {
        id: DEFAULT_KNOWLEDGE_TEST_SET_ID,
        label: "Default bank",
        questions: KNOWLEDGE_TEST,
      },
    ],
    activeTestSetId: DEFAULT_KNOWLEDGE_TEST_SET_ID,
  };
}

/** Normalize CMS / legacy shapes into testSets + activeTestSetId. */
export function normalizeKnowledgeTestPayload(payload: unknown): KnowledgeTestPayload {
  if (Array.isArray(payload)) {
    return {
      testSets: [{ id: DEFAULT_KNOWLEDGE_TEST_SET_ID, label: "Default bank", questions: payload }],
      activeTestSetId: DEFAULT_KNOWLEDGE_TEST_SET_ID,
    };
  }

  const data = (payload ?? {}) as KnowledgeTestPayload;

  if (data.testSets?.length) {
    const activeTestSetId =
      data.activeTestSetId && data.testSets.some((s) => s.id === data.activeTestSetId)
        ? data.activeTestSetId
        : data.testSets[0].id;
    return { ...data, testSets: data.testSets, activeTestSetId };
  }

  const questions = data.questions?.length ? data.questions : KNOWLEDGE_TEST;
  return {
    testSets: [{ id: DEFAULT_KNOWLEDGE_TEST_SET_ID, label: "Default bank", questions }],
    activeTestSetId: DEFAULT_KNOWLEDGE_TEST_SET_ID,
  };
}

export function getActiveKnowledgeTestSet(payload: unknown): KnowledgeTestSet {
  const normalized = normalizeKnowledgeTestPayload(payload);
  const active =
    normalized.testSets?.find((s) => s.id === normalized.activeTestSetId) ?? normalized.testSets?.[0];
  if (active?.questions?.length) return active;
  return {
    id: DEFAULT_KNOWLEDGE_TEST_SET_ID,
    label: "Default bank",
    questions: KNOWLEDGE_TEST,
  };
}

export function getActiveKnowledgeTestQuestions(payload: unknown): KnowledgeQuestion[] {
  return getActiveKnowledgeTestSet(payload).questions;
}
