import { CHAPTERS } from "@/data/playbook";
import playbookSections from "@/data/playbook-sections.json";
import { DEFAULT_PLAYBOOK_HUB_HERO } from "@/data/playbook-hub-hero";
import { CASE_STUDIES, CASE_STUDY_DETAILS } from "@/data/case-studies";
import { DESK_CATEGORIES, DESK_QA } from "@/data/desk-channel";
import { DEFAULT_DESK_CHANNEL_PAGE_COPY } from "@/data/desk-channel-content";
import { GLOSSARY_TERMS } from "@/data/glossary";
import { DEFAULT_GLOSSARY_PAGE_CONTENT } from "@/data/glossary-content";
import { INTERVIEW_QUESTIONS, INTERVIEW_CATEGORIES, INTERVIEW_TABS } from "@/data/interview-questions";
import { createDefaultKnowledgeTestPayload } from "@/lib/content/knowledge-test-payload";
import { buildDefaultCareerRoadmapPayload } from "@/lib/content/career-roadmap-payload";
import { buildDefaultResumeAdminPayload } from "@/lib/content/resume-payload";
import { JOB_OPENINGS, JOB_REGIONS, JOB_LEVELS, JOB_SEGMENTS } from "@/data/job-openings";
import {
  DEFAULT_JOB_OPENINGS_HERO,
  type JobOpeningsHero,
} from "@/data/job-openings-content";
import { DEFAULT_LANDING_CONTENT } from "@/data/landing-content";
import { defaultCareerEdgeNote, defaultSalesEdgeNote } from "@/lib/content/edge-notes";
import { DEFAULT_FAQ_CONTENT } from "@/data/faq";
import { DEFAULT_MEMBER_DASHBOARD_CONTENT } from "@/data/member-dashboard";
import { DEFAULT_SALES_MARKET_NUDGES_CONTENT } from "@/data/sales-market-nudges";
import { DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT } from "@/data/account-intelligence-content";
import { DEFAULT_MENTOR_CONNECT_CONTENT } from "@/data/mentor-connect-content";
import {
  STARTER_INFOGRAPHICS,
  STARTER_EMAIL_DIGEST,
  STARTER_PACK_HERO,
  STARTER_UPGRADE_CTA,
  STARTER_CHAPTER_PREVIEW,
} from "@/data/starter-pack";
import { DEFAULT_SITE_FOOTER } from "@/data/footer-content";
import type { ContentSlug } from "./modules";

export function getDefaultPayload(slug: ContentSlug): unknown {
  switch (slug) {
    case "landing":
      return {
        ...DEFAULT_LANDING_CONTENT,
        careerEdgeNote: defaultCareerEdgeNote(),
        salesEdgeNote: defaultSalesEdgeNote(),
      };
    case "faq":
      return DEFAULT_FAQ_CONTENT;
    case "glossary":
      return { ...DEFAULT_GLOSSARY_PAGE_CONTENT, terms: GLOSSARY_TERMS };
    case "playbook":
      return { chapters: CHAPTERS, sections: playbookSections, hubHero: DEFAULT_PLAYBOOK_HUB_HERO };
    case "case-studies":
      return { studies: CASE_STUDIES, details: CASE_STUDY_DETAILS };
    case "desk-channel":
      return {
        categories: DESK_CATEGORIES,
        questions: DESK_QA,
        pageCopy: DEFAULT_DESK_CHANNEL_PAGE_COPY,
      };
    case "interview-questions":
      return { questions: INTERVIEW_QUESTIONS, categories: INTERVIEW_CATEGORIES, tabs: INTERVIEW_TABS };
    case "knowledge-test":
      return createDefaultKnowledgeTestPayload();
    case "career-roadmap":
      return buildDefaultCareerRoadmapPayload();
    case "resume-templates":
      return buildDefaultResumeAdminPayload();
    case "job-openings":
      return {
        hero: DEFAULT_JOB_OPENINGS_HERO,
        jobs: JOB_OPENINGS,
        regions: JOB_REGIONS,
        levels: JOB_LEVELS,
        segments: JOB_SEGMENTS,
      };
    case "starter-pack":
      return {
        hero: STARTER_PACK_HERO,
        infographics: STARTER_INFOGRAPHICS,
        emailDigest: STARTER_EMAIL_DIGEST,
        chapterPreview: STARTER_CHAPTER_PREVIEW,
        upgradeCta: STARTER_UPGRADE_CTA,
      };
    case "mentor-connect":
      return DEFAULT_MENTOR_CONNECT_CONTENT;
    case "library":
      return { files: [] };
    case "site-footer":
      return DEFAULT_SITE_FOOTER;
    case "footer-guides":
      return { careerGuide: null, salesGuide: null };
    case "member-dashboard":
      return DEFAULT_MEMBER_DASHBOARD_CONTENT;
    case "sales-market-nudges":
      return DEFAULT_SALES_MARKET_NUDGES_CONTENT;
    case "account-intelligence":
      return DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT;
    case "mentors":
      return { overrides: [] };
    default:
      return {};
  }
}

export function getAllDefaultPayloads(): Record<ContentSlug, unknown> {
  return {
    landing: getDefaultPayload("landing"),
    faq: getDefaultPayload("faq"),
    glossary: getDefaultPayload("glossary"),
    playbook: getDefaultPayload("playbook"),
    "resume-templates": getDefaultPayload("resume-templates"),
    "career-roadmap": getDefaultPayload("career-roadmap"),
    "interview-questions": getDefaultPayload("interview-questions"),
    "knowledge-test": getDefaultPayload("knowledge-test"),
    "case-studies": getDefaultPayload("case-studies"),
    "desk-channel": getDefaultPayload("desk-channel"),
    "job-openings": getDefaultPayload("job-openings"),
    "starter-pack": getDefaultPayload("starter-pack"),
    "mentor-connect": getDefaultPayload("mentor-connect"),
    "library": getDefaultPayload("library"),
    "footer-guides": getDefaultPayload("footer-guides"),
    "site-footer": getDefaultPayload("site-footer"),
    "member-dashboard": getDefaultPayload("member-dashboard"),
    "sales-market-nudges": getDefaultPayload("sales-market-nudges"),
    "account-intelligence": getDefaultPayload("account-intelligence"),
    mentors: getDefaultPayload("mentors"),
  };
}
