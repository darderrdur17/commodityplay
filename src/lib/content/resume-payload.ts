import { PERSONA_ARCHETYPES } from "@/data/persona-archetypes";
import {
  INDUSTRY_MAP,
  PERSONA_QUIZ_STEPS,
  RESUME_TEMPLATES,
  RESUME_VETTING_SECTION,
  mergeResumeVettingSection,
  type PersonaQuizStep,
  type ResumeTemplate,
} from "@/data/resume-templates";

/** Admin editor — persona type row */
export interface ResumeAdminPersona {
  id: string;
  name: string;
  label: string;
  desc: string;
}

/** Admin editor — quiz option */
export interface ResumeAdminQuizOption {
  id: string;
  label: string;
  value: string;
}

/** Admin editor — quiz step (maps to public PersonaQuizStep) */
export interface ResumeAdminQuizStep {
  id: string;
  question: string;
  sub?: string;
  options: ResumeAdminQuizOption[];
}

/** Admin editor — template row */
export interface ResumeAdminTemplate {
  id: string;
  personaId: string;
  title: string;
  description: string;
  fileKey: string;
  templateFile?: string;
  assetId?: string;
}

export interface ResumeAdminPayload {
  personas?: ResumeAdminPersona[];
  quiz?: ResumeAdminQuizStep[];
  quizSteps?: PersonaQuizStep[];
  templates?: ResumeAdminTemplate[] | ResumeTemplate[];
  vettingSection?: Partial<typeof RESUME_VETTING_SECTION>;
  /** @deprecated Legacy CMS key — use vettingSection */
  vetting?: Partial<typeof RESUME_VETTING_SECTION>;
  industryMap?: typeof INDUSTRY_MAP;
}

/** Seed admin tabs from live resume page content (archetypes, quiz, templates, vetting). */
export function buildDefaultResumeAdminPayload(): ResumeAdminPayload {
  const personas: ResumeAdminPersona[] = Object.values(PERSONA_ARCHETYPES).map((a) => ({
    id: a.id,
    name: a.name,
    label: a.label,
    desc: a.desc,
  }));

  const quiz = PERSONA_QUIZ_STEPS.map((step) => ({
    id: step.id,
    question: step.question,
    sub: step.sub,
    options: step.options.map((opt, i) => ({
      id: `${step.id}-opt-${i}`,
      label: opt.label,
      value: opt.value,
    })),
  }));

  const templates: ResumeAdminTemplate[] = RESUME_TEMPLATES.map((t) => ({
    id: t.id,
    personaId: t.id,
    title: t.label,
    description: t.positioningChallenge,
    fileKey: `resume-templates/${t.templateFile}`,
    templateFile: t.templateFile,
  }));

  return {
    personas,
    quiz,
    quizSteps: PERSONA_QUIZ_STEPS,
    templates,
    industryMap: INDUSTRY_MAP,
    vettingSection: RESUME_VETTING_SECTION,
  };
}

function isAdminTemplate(
  t: ResumeAdminTemplate | ResumeTemplate
): t is ResumeAdminTemplate {
  return "personaId" in t || "fileKey" in t;
}

export function adminQuizToQuizSteps(quiz: ResumeAdminQuizStep[] | undefined): PersonaQuizStep[] {
  if (!quiz?.length) return PERSONA_QUIZ_STEPS;
  return quiz.map((step) => ({
    id: step.id,
    question: step.question,
    sub: step.sub ?? "",
    options: step.options.map((opt) => ({
      value: opt.value,
      label: opt.label,
      sub: undefined,
      persona: undefined,
    })),
  }));
}

export function adminTemplatesToPublic(
  templates: (ResumeAdminTemplate | ResumeTemplate)[] | undefined
): ResumeTemplate[] {
  if (!templates?.length) return RESUME_TEMPLATES;

  const defaultById = new Map(RESUME_TEMPLATES.map((t) => [t.id, t]));

  return templates.map((raw) => {
    if (!isAdminTemplate(raw)) return raw as ResumeTemplate;

    const id = raw.personaId || raw.id;
    const fallback = defaultById.get(id);
    const templateFile =
      raw.templateFile ||
      fallback?.templateFile ||
      raw.fileKey?.replace(/^resume-templates\//, "") ||
      "";

    return {
      id,
      persona: fallback?.persona ?? id.toUpperCase(),
      label: raw.title?.trim() || fallback?.label || id,
      roleBand: fallback?.roleBand ?? "",
      positioningChallenge: raw.description?.trim() || fallback?.positioningChallenge || "",
      templateFile,
      keyMove: fallback?.keyMove,
      ...(raw.assetId ? { assetId: raw.assetId } : {}),
    } as ResumeTemplate & { assetId?: string };
  });
}

/** Admin Content CMS — merge stored payload with seeded defaults from the public page. */
export function resolveEditorResumePayload(payload: unknown): ResumeAdminPayload {
  const seeded = buildDefaultResumeAdminPayload();
  const stored = (payload && typeof payload === "object" ? payload : {}) as ResumeAdminPayload;

  const personas =
    Array.isArray(stored.personas) && stored.personas.length > 0
      ? stored.personas
      : seeded.personas;

  const quiz =
    Array.isArray(stored.quiz) && stored.quiz.length > 0
      ? stored.quiz
      : seeded.quiz;

  const quizSteps =
    Array.isArray(stored.quizSteps) && stored.quizSteps.length > 0
      ? stored.quizSteps
      : adminQuizToQuizSteps(quiz);

  const templates =
    Array.isArray(stored.templates) && stored.templates.length > 0
      ? stored.templates
      : seeded.templates;

  return {
    ...seeded,
    ...stored,
    personas,
    quiz,
    quizSteps,
    templates,
    industryMap: stored.industryMap?.length ? stored.industryMap : seeded.industryMap,
    vettingSection: mergeResumeVettingSection(stored.vettingSection ?? stored.vetting),
  };
}
