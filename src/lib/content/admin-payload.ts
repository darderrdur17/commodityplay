import { DESK_QA } from "@/data/desk-channel";
import { INTERVIEW_QUESTIONS } from "@/data/interview-questions";
import { getDefaultPayload } from "./defaults";
import { deepMerge } from "./merge";
import {
  createDefaultKnowledgeTestPayload,
  normalizeKnowledgeTestPayload,
} from "./knowledge-test-payload";
import type { ContentSlug } from "./modules";

/** Admin editor payload — merge repo defaults so empty CMS rows still show live site content. */
export function resolveAdminModulePayload(slug: ContentSlug, payload: unknown): unknown {
  const defaults = getDefaultPayload(slug) as Record<string, unknown>;

  if (slug === "desk-channel") {
    if (Array.isArray(payload)) {
      return {
        categories: defaults.categories,
        questions: payload.length ? payload : DESK_QA,
      };
    }
    const merged = deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
    const stored = (payload as { questions?: unknown[] } | null)?.questions;
    if (!Array.isArray(stored) || stored.length === 0) {
      merged.questions = defaults.questions ?? DESK_QA;
    }
    return merged;
  }

  if (slug === "interview-questions") {
    if (Array.isArray(payload)) {
      return {
        questions: payload.length ? payload : INTERVIEW_QUESTIONS,
        categories: defaults.categories,
        tabs: defaults.tabs,
      };
    }
    const merged = deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
    const stored = (payload as { questions?: unknown[] } | null)?.questions;
    if (!Array.isArray(stored) || stored.length === 0) {
      merged.questions = defaults.questions ?? INTERVIEW_QUESTIONS;
    }
    return merged;
  }

  if (slug === "knowledge-test") {
    return normalizeKnowledgeTestPayload(payload);
  }

  if (slug === "glossary") {
    const merged = deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
    const stored = (payload as { terms?: unknown[] } | null)?.terms;
    if (!Array.isArray(stored) || stored.length === 0) {
      merged.terms = defaults.terms;
    }
    return merged;
  }

  return deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
}
