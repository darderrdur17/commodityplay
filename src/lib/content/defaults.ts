import { CHAPTERS } from "@/data/playbook";
import playbookSections from "@/data/playbook-sections.json";
import { CASE_STUDIES, CASE_STUDY_DETAILS } from "@/data/case-studies";
import { DESK_CATEGORIES, DESK_QA } from "@/data/desk-channel";
import { GLOSSARY_TERMS } from "@/data/glossary";
import { INTERVIEW_QUESTIONS, INTERVIEW_CATEGORIES, INTERVIEW_TABS } from "@/data/interview-questions";
import { KNOWLEDGE_TEST } from "@/data/knowledge-test";
import { CAREER_ROLES } from "@/data/career-roadmap";
import {
  FUNCTION_MATRIX,
  TIMELINE_12_MONTH,
  NAVIGATION_GUIDE,
  COMP_BENCHMARKS,
} from "@/data/career-roadmap-extras";
import {
  RESUME_TEMPLATES,
  PERSONA_QUIZ_QUESTIONS,
  PERSONA_QUIZ_STEPS,
  INDUSTRY_MAP,
} from "@/data/resume-templates";
import { JOB_OPENINGS, JOB_REGIONS, JOB_LEVELS, JOB_SEGMENTS } from "@/data/job-openings";
import { DEFAULT_LANDING_CONTENT } from "@/data/landing-content";
import { DEFAULT_FAQ_CONTENT } from "@/data/faq";
import { DEFAULT_MEMBER_DASHBOARD_CONTENT } from "@/data/member-dashboard";
import { STARTER_INFOGRAPHICS, STARTER_MARKET_NOTE, STARTER_CHAPTER_PREVIEW } from "@/data/starter-pack";
import type { ContentSlug } from "./modules";

export function getDefaultPayload(slug: ContentSlug): unknown {
  switch (slug) {
    case "landing":
      return DEFAULT_LANDING_CONTENT;
    case "faq":
      return DEFAULT_FAQ_CONTENT;
    case "glossary":
      return { terms: GLOSSARY_TERMS };
    case "playbook":
      return { chapters: CHAPTERS, sections: playbookSections };
    case "case-studies":
      return { studies: CASE_STUDIES, details: CASE_STUDY_DETAILS };
    case "desk-channel":
      return { categories: DESK_CATEGORIES, questions: DESK_QA };
    case "interview-questions":
      return { questions: INTERVIEW_QUESTIONS, categories: INTERVIEW_CATEGORIES, tabs: INTERVIEW_TABS };
    case "knowledge-test":
      return { questions: KNOWLEDGE_TEST };
    case "career-roadmap":
      return {
        roles: CAREER_ROLES,
        functionMatrix: FUNCTION_MATRIX,
        timeline12Month: TIMELINE_12_MONTH,
        navigationGuide: NAVIGATION_GUIDE,
        compBenchmarks: COMP_BENCHMARKS,
      };
    case "resume-templates":
      return {
        templates: RESUME_TEMPLATES,
        quiz: PERSONA_QUIZ_QUESTIONS,
        quizSteps: PERSONA_QUIZ_STEPS,
        industryMap: INDUSTRY_MAP,
      };
    case "job-openings":
      return {
        jobs: JOB_OPENINGS,
        regions: JOB_REGIONS,
        levels: JOB_LEVELS,
        segments: JOB_SEGMENTS,
      };
    case "starter-pack":
      return {
        infographics: STARTER_INFOGRAPHICS,
        marketNote: STARTER_MARKET_NOTE,
        chapterPreview: STARTER_CHAPTER_PREVIEW,
      };
    case "mentor-connect":
      return { categories: [] };
    case "library":
      return { files: [] };
    case "footer-guides":
      return { careerGuide: null, salesGuide: null };
    case "member-dashboard":
      return DEFAULT_MEMBER_DASHBOARD_CONTENT;
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
    "member-dashboard": getDefaultPayload("member-dashboard"),
    mentors: getDefaultPayload("mentors"),
  };
}
