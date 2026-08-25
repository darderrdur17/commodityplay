import { CHAPTERS, PLAYBOOK_TOTAL_CHAPTERS, type PlaybookSection } from "@/data/playbook";
import { CASE_STUDIES } from "@/data/case-studies";
import { DESK_CATEGORIES, DESK_QA } from "@/data/desk-channel";
import { GLOSSARY_TERMS } from "@/data/glossary";
import { INTERVIEW_QUESTIONS } from "@/data/interview-questions";
import { CAREER_ROLES } from "@/data/career-roadmap";
import { RESUME_TEMPLATES } from "@/data/resume-templates";
import { JOB_OPENINGS } from "@/data/job-openings";
import { MENTOR_SEGMENTS } from "@/data/mentors";
import playbookSections from "@/data/playbook-sections.json";
import type { LandingContent } from "@/data/landing-content";
import type { MemberDashboardContent } from "@/data/member-dashboard";
import {
  formatContentPlaceholders,
  formatContentPlaceholdersDeep,
  type ContentStatsSnapshot,
} from "./content-stat-placeholders";
import {
  getCaseStudiesList,
  getCareerRoles,
  getDeskChannelData,
  getGlossaryTerms,
  getInterviewQuestionsData,
  getJobOpeningsData,
  getKnowledgeTestQuestions,
  getPublishedMentorSegments,
  getResumeTemplatesData,
} from "./accessors";
import { getPublishedPayload } from "./repository";

export type ContentStats = ContentStatsSnapshot;

function countPlaybookSections(
  chapterIds: string[],
  sections: typeof playbookSections
): number {
  let total = 0;
  for (const id of chapterIds) {
    const key = id as keyof typeof sections;
    total += ((sections[key] as PlaybookSection[] | undefined)?.length ?? 0);
  }
  return total;
}

async function resolvePlaybookCounts(): Promise<{ chapterCount: number; sectionCount: number }> {
  const data = await getPublishedPayload<{
    chapters?: typeof CHAPTERS;
    sections?: typeof playbookSections;
  }>("playbook");
  const chapters = data.chapters ?? CHAPTERS;
  const sections = data.sections ?? playbookSections;
  const chapterIds = chapters.map((c) => c.id);
  return {
    chapterCount: Math.max(chapters.length, PLAYBOOK_TOTAL_CHAPTERS),
    sectionCount: countPlaybookSections(chapterIds, sections),
  };
}

async function resolveMentorCounts(): Promise<{ mentorCount: number; segmentCount: number }> {
  const segments = await getPublishedMentorSegments();
  const mentorCount = segments.reduce((sum, seg) => sum + seg.mentors.length, 0);
  const segmentCount = segments.length;
  if (mentorCount > 0) {
    return { mentorCount, segmentCount };
  }
  const fallbackMentors = MENTOR_SEGMENTS.reduce((sum, seg) => sum + seg.mentors.length, 0);
  return { mentorCount: fallbackMentors, segmentCount: MENTOR_SEGMENTS.length };
}

/** Fetch all content counts in one parallel round-trip. */
export async function getContentStats(): Promise<ContentStats> {
  const [
    playbook,
    templates,
    roles,
    interview,
    knowledgeQuestions,
    caseStudies,
    desk,
    mentors,
    jobs,
    glossary,
  ] = await Promise.all([
    resolvePlaybookCounts(),
    getResumeTemplatesData(),
    getCareerRoles(),
    getInterviewQuestionsData(),
    getKnowledgeTestQuestions(),
    getCaseStudiesList(),
    getDeskChannelData(),
    resolveMentorCounts(),
    getJobOpeningsData(),
    getGlossaryTerms(),
  ]);

  const deskSegments = (desk.categories ?? DESK_CATEGORIES).filter((c) => c.id !== "all").length;

  return {
    chapterCount: playbook.chapterCount,
    sectionCount: playbook.sectionCount,
    templateCount: templates.templates?.length ?? RESUME_TEMPLATES.length,
    roleCount: roles.roles?.length ?? CAREER_ROLES.length,
    interviewCount: interview.questions?.length ?? INTERVIEW_QUESTIONS.length,
    knowledgeTestCount: knowledgeQuestions.length,
    caseStudyCount: caseStudies.length ?? CASE_STUDIES.length,
    deskQaCount: desk.questions?.length ?? DESK_QA.length,
    deskSegmentCount: deskSegments,
    mentorCount: mentors.mentorCount,
    segmentCount: mentors.segmentCount,
    jobCount: jobs.jobs?.length ?? JOB_OPENINGS.length,
    glossaryCount: glossary.length ?? GLOSSARY_TERMS.length,
  };
}

export { formatContentPlaceholders } from "./content-stat-placeholders";

export function applyContentStatsToMemberDashboard(
  content: MemberDashboardContent,
  stats: ContentStats
): MemberDashboardContent {
  return {
    ...content,
    resourceCards: content.resourceCards.map((card) => ({
      ...card,
      description: formatContentPlaceholders(card.description, stats),
    })),
    salesResourceCards: content.salesResourceCards.map((card) => ({
      ...card,
      description: formatContentPlaceholders(card.description, stats),
    })),
  };
}

/** Resolve `{chapterCount}` and other placeholders across landing page CMS copy. */
export function applyContentStatsToLandingContent(
  content: LandingContent,
  stats: ContentStats
): LandingContent {
  return formatContentPlaceholdersDeep(content, stats);
}
