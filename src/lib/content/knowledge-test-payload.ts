import { KNOWLEDGE_TEST, type KnowledgeQuestion } from "@/data/knowledge-test";

export interface KnowledgeTestHeroCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export const DEFAULT_KNOWLEDGE_TEST_HERO: KnowledgeTestHeroCopy = {
  eyebrow: "Pro · {questionCount} Questions{activeSetSuffix}",
  title: "Knowledge Test",
  description:
    "Gap analysis across Playbook foundations — personalised recommendations on where to study next.",
};

export function mergeKnowledgeTestHero(
  cms?: Partial<KnowledgeTestHeroCopy> | null
): KnowledgeTestHeroCopy {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || DEFAULT_KNOWLEDGE_TEST_HERO.eyebrow,
    title: raw.title?.trim() || DEFAULT_KNOWLEDGE_TEST_HERO.title,
    description: raw.description?.trim() || DEFAULT_KNOWLEDGE_TEST_HERO.description,
  };
}

export function formatKnowledgeTestHeroCopy(
  template: string,
  vars: { questionCount: number; activeSetLabel?: string; liveSetCount?: number }
): string {
  const suffix = vars.activeSetLabel?.trim() ? ` · ${vars.activeSetLabel.trim()}` : "";
  return template
    .replaceAll("{questionCount}", String(vars.questionCount))
    .replaceAll("{activeSetLabel}", vars.activeSetLabel?.trim() || "")
    .replaceAll("{activeSetSuffix}", suffix)
    .replaceAll("{liveSetCount}", String(vars.liveSetCount ?? 0));
}

export interface KnowledgeTestSet {
  id: string;
  label: string;
  questions: KnowledgeQuestion[];
  /**
   * Live on the member site. Multiple sets may be live at once.
   * False / omitted after migration = unpublished draft.
   */
  published?: boolean;
}

export interface KnowledgeTestPayload {
  /** @deprecated Legacy flat list — migrated to testSets on read */
  questions?: KnowledgeQuestion[];
  testSets?: KnowledgeTestSet[];
  /**
   * Legacy single-live pointer. Still kept as the primary live set id for older
   * consumers. Members now see every set with `published: true`.
   */
  activeTestSetId?: string;
  hero?: Partial<KnowledgeTestHeroCopy>;
}

export const DEFAULT_KNOWLEDGE_TEST_SET_ID = "default";

export function createDefaultKnowledgeTestPayload(): KnowledgeTestPayload {
  return {
    testSets: [
      {
        id: DEFAULT_KNOWLEDGE_TEST_SET_ID,
        label: "Default bank",
        questions: KNOWLEDGE_TEST,
        published: true,
      },
    ],
    activeTestSetId: DEFAULT_KNOWLEDGE_TEST_SET_ID,
    hero: { ...DEFAULT_KNOWLEDGE_TEST_HERO },
  };
}

function primaryLiveSetId(sets: KnowledgeTestSet[], preferred?: string): string | undefined {
  const live = sets.filter((s) => s.published);
  if (preferred && live.some((s) => s.id === preferred)) return preferred;
  return live[0]?.id ?? sets[0]?.id;
}

/**
 * Legacy CMS stored one live set via `activeTestSetId`. Until Frances toggles
 * `published` on any set, only that id is live; every other set is unpublished.
 */
export function applyKnowledgeTestPublishedFlags(
  sets: KnowledgeTestSet[],
  activeTestSetId?: string
): KnowledgeTestSet[] {
  const anyExplicit = sets.some((s) => typeof s.published === "boolean");
  if (anyExplicit) {
    return sets.map((s) => ({ ...s, published: s.published === true }));
  }
  const liveId =
    activeTestSetId && sets.some((s) => s.id === activeTestSetId) ? activeTestSetId : sets[0]?.id;
  return sets.map((s) => ({ ...s, published: s.id === liveId }));
}

/** Normalize CMS / legacy shapes into testSets + published flags + activeTestSetId. */
export function normalizeKnowledgeTestPayload(payload: unknown): KnowledgeTestPayload {
  if (Array.isArray(payload)) {
    const testSets = applyKnowledgeTestPublishedFlags(
      [{ id: DEFAULT_KNOWLEDGE_TEST_SET_ID, label: "Default bank", questions: payload }],
      DEFAULT_KNOWLEDGE_TEST_SET_ID
    );
    return {
      testSets,
      activeTestSetId: DEFAULT_KNOWLEDGE_TEST_SET_ID,
      hero: mergeKnowledgeTestHero(undefined),
    };
  }

  const data = (payload ?? {}) as KnowledgeTestPayload;
  const hero = mergeKnowledgeTestHero(data.hero);

  if (data.testSets?.length) {
    const allEmpty = data.testSets.every((s) => !s.questions?.length);
    if (allEmpty) return { ...createDefaultKnowledgeTestPayload(), hero };

    const testSets = applyKnowledgeTestPublishedFlags(data.testSets, data.activeTestSetId);
    return {
      ...data,
      testSets,
      activeTestSetId: primaryLiveSetId(testSets, data.activeTestSetId),
      hero,
    };
  }

  const questions = data.questions?.length ? data.questions : KNOWLEDGE_TEST;
  const testSets = applyKnowledgeTestPublishedFlags(
    [{ id: DEFAULT_KNOWLEDGE_TEST_SET_ID, label: "Default bank", questions }],
    DEFAULT_KNOWLEDGE_TEST_SET_ID
  );
  return {
    testSets,
    activeTestSetId: DEFAULT_KNOWLEDGE_TEST_SET_ID,
    hero,
  };
}

export function getLiveKnowledgeTestSets(payload: unknown): KnowledgeTestSet[] {
  const normalized = normalizeKnowledgeTestPayload(payload);
  return (normalized.testSets ?? []).filter((s) => s.published && s.questions?.length);
}

export function getActiveKnowledgeTestSet(payload: unknown): KnowledgeTestSet {
  const live = getLiveKnowledgeTestSets(payload);
  if (live[0]?.questions?.length) return live[0];
  return {
    id: DEFAULT_KNOWLEDGE_TEST_SET_ID,
    label: "Default bank",
    questions: [],
    published: false,
  };
}

export function getActiveKnowledgeTestQuestions(payload: unknown): KnowledgeQuestion[] {
  return getActiveKnowledgeTestSet(payload).questions;
}

export function memberKnowledgeTestHeroVars(liveSets: Pick<KnowledgeTestSet, "id" | "label" | "questions">[]): {
  questionCount: number;
  activeSetLabel?: string;
  liveSetCount: number;
} {
  const liveSetCount = liveSets.length;
  const questionCount =
    liveSetCount === 1 ? liveSets[0].questions.length : liveSets.reduce((n, s) => n + s.questions.length, 0);
  const activeSetLabel =
    liveSetCount === 0
      ? undefined
      : liveSetCount === 1
        ? liveSets[0].label
        : `${liveSetCount} live sets`;
  return { questionCount, activeSetLabel, liveSetCount };
}
