import { DESK_QA } from "@/data/desk-channel";
import { INTERVIEW_QUESTIONS } from "@/data/interview-questions";
import { JOB_OPENINGS } from "@/data/job-openings";
import { CASE_STUDIES, CASE_STUDY_DETAILS } from "@/data/case-studies";
import { DEFAULT_CASE_STUDIES_HERO } from "@/lib/content/case-studies-payload";
import { hydrateDeskQaDates } from "@/lib/content/desk-channel-freshness";
import { DEFAULT_DESK_CHANNEL_PAGE_COPY } from "@/data/desk-channel-content";
import { getDefaultPayload } from "./defaults";
import { deepMerge } from "./merge";
import { resolvePlaybookPayload } from "./playbook-payload";
import { resolveEditorResumePayload } from "./resume-payload";
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
        questions: hydrateDeskQaDates((payload.length ? payload : DESK_QA) as import("@/data/desk-channel").DeskQA[]),
        pageCopy: defaults.pageCopy ?? DEFAULT_DESK_CHANNEL_PAGE_COPY,
      };
    }
    const merged = deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
    const stored = (payload as { questions?: unknown[] } | null)?.questions;
    if (!Array.isArray(stored) || stored.length === 0) {
      merged.questions = defaults.questions ?? DESK_QA;
    }
    if (Array.isArray(merged.questions)) {
      merged.questions = hydrateDeskQaDates(merged.questions as import("@/data/desk-channel").DeskQA[]);
    }
    return merged;
  }

  if (slug === "interview-questions") {
    if (Array.isArray(payload)) {
      return {
        questions: payload.length ? payload : INTERVIEW_QUESTIONS,
        categories: defaults.categories,
        tabs: defaults.tabs,
        hero: defaults.hero,
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

  if (slug === "job-openings") {
    if (Array.isArray(payload)) {
      return {
        hero: defaults.hero,
        regions: defaults.regions,
        levels: defaults.levels,
        segments: defaults.segments,
        jobs: payload.length ? payload : JOB_OPENINGS,
      };
    }
    const merged = deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
    const stored = (payload as { jobs?: unknown[] } | null)?.jobs;
    if (!Array.isArray(stored) || stored.length === 0) {
      merged.jobs = defaults.jobs ?? JOB_OPENINGS;
    }
    return merged;
  }

  if (slug === "case-studies") {
    if (Array.isArray(payload)) {
      return {
        studies: payload.length ? payload : CASE_STUDIES,
        details: CASE_STUDY_DETAILS,
        hero: (defaults as { hero?: unknown }).hero ?? DEFAULT_CASE_STUDIES_HERO,
      };
    }
    const merged = deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
    const stored = (payload as { studies?: unknown[] } | null)?.studies;
    if (!Array.isArray(stored) || stored.length === 0) {
      merged.studies = defaults.studies ?? CASE_STUDIES;
    }
    const storedDetails = (payload as { details?: Record<string, unknown> } | null)?.details;
    if (!storedDetails || Object.keys(storedDetails).length === 0) {
      merged.details = defaults.details ?? CASE_STUDY_DETAILS;
    }
    return merged;
  }

  if (slug === "resume-templates") {
    return resolveEditorResumePayload(payload);
  }

  if (slug === "playbook") {
    return resolvePlaybookPayload(payload);
  }

  return deepMerge(defaults, (payload ?? {}) as Record<string, unknown>);
}
