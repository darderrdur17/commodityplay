import { PERSONA_ARCHETYPES } from "@/data/persona-archetypes";
import {
  INDUSTRY_MAP,
  PERSONA_QUIZ_STEPS,
  POSITIONING_PRINCIPLE,
  RESUME_TEMPLATES,
  RESUME_VETTING_SECTION,
  TEMPLATE_CARD_DETAILS,
  mergeResumeVettingSection,
  type PersonaQuizStep,
  type ResumeTemplate,
  type TemplateCardDetails,
} from "@/data/resume-templates";

export interface ResumePageHero {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  stats: { num: string; label: string }[];
}

export interface ResumeSectionCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface ResumeQuizSectionCopy extends ResumeSectionCopy {
  finderTitle: string;
  finderSub: string;
}

export const DEFAULT_RESUME_PAGE_HERO: ResumePageHero = {
  eyebrow: "Pro Pack · Resume Templates",
  title: "Your Resume,",
  titleAccent: "Positioned Right.",
  description:
    "Five archetype-specific templates built for how the commodity trading industry actually reads a CV. Take the quiz to find your archetype — then download the template built for your exact positioning challenge.",
  stats: [
    { num: "5", label: "Archetypes covered" },
    { num: "Word", label: "Download-ready .docx" },
    { num: "Free", label: "Resume vetting with Pro" },
  ],
};

export const DEFAULT_RESUME_QUIZ_SECTION: ResumeQuizSectionCopy = {
  eyebrow: "Step 1",
  title: "Find Your Archetype",
  description:
    "Five questions. Tells you exactly which template fits your background — and what your specific positioning challenge is.",
  finderTitle: "Archetype Finder",
  finderSub: "5 questions · 2 minutes · Instant result",
};

export const DEFAULT_RESUME_INDUSTRY_MAP_SECTION: ResumeSectionCopy = {
  eyebrow: "Step 2 — Understand the Landscape",
  title: "Where Does Your Role Sit?",
  description:
    "Commodity trading is not one function — it is a set of closely connected roles across six zones. Understanding where you sit shapes how your resume must be written.",
};

export const DEFAULT_RESUME_TEMPLATES_SECTION: ResumeSectionCopy = {
  eyebrow: "Step 3 — Download Your Template",
  title: "The 5 Archetype Templates",
  description:
    "Each template is built for a specific positioning challenge — not a generic CV layout. Download the one that matches your archetype.",
};

function mergePageHero(
  cms: Partial<ResumePageHero> | null | undefined,
  defaults: ResumePageHero = DEFAULT_RESUME_PAGE_HERO
): ResumePageHero {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    titleAccent: raw.titleAccent?.trim() || defaults.titleAccent,
    description: raw.description?.trim() || defaults.description,
    stats: raw.stats?.length ? raw.stats : defaults.stats,
  };
}

function mergeSectionCopy(
  cms: Partial<ResumeSectionCopy> | null | undefined,
  defaults: ResumeSectionCopy
): ResumeSectionCopy {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
  };
}

function mergeQuizSection(
  cms: Partial<ResumeQuizSectionCopy> | null | undefined
): ResumeQuizSectionCopy {
  const raw = cms ?? {};
  const base = mergeSectionCopy(raw, DEFAULT_RESUME_QUIZ_SECTION);
  return {
    ...base,
    finderTitle: raw.finderTitle?.trim() || DEFAULT_RESUME_QUIZ_SECTION.finderTitle,
    finderSub: raw.finderSub?.trim() || DEFAULT_RESUME_QUIZ_SECTION.finderSub,
  };
}

function mergePositioningPrinciple(
  cms: Partial<{ title: string; body: string }> | null | undefined
): { title: string; body: string } {
  const raw = cms ?? {};
  return {
    title: raw.title?.trim() || POSITIONING_PRINCIPLE.title,
    body: raw.body?.trim() || POSITIONING_PRINCIPLE.body,
  };
}

function mergeTemplateCardDetails(
  cms: Record<string, Partial<TemplateCardDetails>> | null | undefined
): Record<string, TemplateCardDetails> {
  const next: Record<string, TemplateCardDetails> = { ...TEMPLATE_CARD_DETAILS };
  if (!cms) return next;
  for (const [id, patch] of Object.entries(cms)) {
    const base = next[id];
    if (!base) {
      if (patch.title && patch.whoThisIsFor && patch.highlights && patch.previewTagline && patch.previewSections) {
        next[id] = patch as TemplateCardDetails;
      }
      continue;
    }
    next[id] = {
      ...base,
      ...patch,
      highlights: patch.highlights?.length ? patch.highlights : base.highlights,
      previewSections: patch.previewSections?.length ? patch.previewSections : base.previewSections,
    };
  }
  return next;
}

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
  pageHero?: Partial<ResumePageHero>;
  quizSection?: Partial<ResumeQuizSectionCopy>;
  industryMapSection?: Partial<ResumeSectionCopy>;
  templatesSection?: Partial<ResumeSectionCopy>;
  positioningPrinciple?: Partial<{ title: string; body: string }>;
  templateCardDetails?: Record<string, Partial<TemplateCardDetails>>;
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
    pageHero: DEFAULT_RESUME_PAGE_HERO,
    quizSection: DEFAULT_RESUME_QUIZ_SECTION,
    industryMapSection: DEFAULT_RESUME_INDUSTRY_MAP_SECTION,
    templatesSection: DEFAULT_RESUME_TEMPLATES_SECTION,
    positioningPrinciple: POSITIONING_PRINCIPLE,
    templateCardDetails: TEMPLATE_CARD_DETAILS,
  };
}

function isAdminTemplate(
  t: ResumeAdminTemplate | ResumeTemplate
): t is ResumeAdminTemplate {
  return "personaId" in t || "fileKey" in t;
}

function filled(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function cloneAdminQuiz(steps: ResumeAdminQuizStep[]): ResumeAdminQuizStep[] {
  return steps.map((step) => ({
    ...step,
    options: (step.options ?? []).map((opt) => ({ ...opt })),
  }));
}

/** Seed missing default quiz questions when CMS only has a stub; keep Frances's edits and extras. */
export function mergeResumeAdminQuiz(
  stored: ResumeAdminQuizStep[] | undefined,
  defaults: ResumeAdminQuizStep[]
): ResumeAdminQuizStep[] {
  if (!defaults.length) return stored?.length ? cloneAdminQuiz(stored) : [];
  if (!stored?.length) return cloneAdminQuiz(defaults);

  const defaultsById = new Map(defaults.map((step) => [step.id, step]));
  const usedDefaultIds = new Set<string>();

  const fromCms = stored.map((cms, i) => {
    const byId = filled(cms.id) ? defaultsById.get(cms.id) : undefined;
    const byIndex = !byId && !filled(cms.id) ? defaults[i] : undefined;
    const base = byId ?? byIndex;
    if (base) usedDefaultIds.add(base.id);
    if (!base) {
      return {
        id: cms.id || `qq-${i}`,
        question: cms.question ?? "",
        sub: cms.sub,
        options: (cms.options ?? []).map((opt) => ({ ...opt })),
      };
    }
    return {
      id: filled(cms.id) ? cms.id : base.id,
      question: filled(cms.question) ? cms.question : base.question,
      sub: filled(cms.sub) ? cms.sub : base.sub,
      options: cms.options?.length ? cms.options.map((opt) => ({ ...opt })) : base.options.map((opt) => ({ ...opt })),
    };
  });

  const missing = defaults.filter((step) => !usedDefaultIds.has(step.id));
  return [...fromCms, ...cloneAdminQuiz(missing)];
}

/** Seed missing persona types from repo defaults; keep extras Frances adds. */
export function mergeResumeAdminPersonas(
  stored: ResumeAdminPersona[] | undefined,
  defaults: ResumeAdminPersona[]
): ResumeAdminPersona[] {
  if (!defaults.length) return stored?.length ? stored.map((p) => ({ ...p })) : [];
  if (!stored?.length) return defaults.map((p) => ({ ...p }));

  const defaultsById = new Map(defaults.map((p) => [p.id, p]));
  const used = new Set<string>();

  const fromCms = stored.map((cms, i) => {
    const byId = filled(cms.id) ? defaultsById.get(cms.id) : undefined;
    const byIndex = !byId && !filled(cms.id) ? defaults[i] : undefined;
    const base = byId ?? byIndex;
    if (base) used.add(base.id);
    if (!base) return { ...cms };
    return {
      id: filled(cms.id) ? cms.id : base.id,
      name: filled(cms.name) ? cms.name : base.name,
      label: filled(cms.label) ? cms.label : base.label,
      desc: filled(cms.desc) ? cms.desc : base.desc,
    };
  });

  return [...fromCms, ...defaults.filter((p) => !used.has(p.id)).map((p) => ({ ...p }))];
}

/** Member vetting dropdown — CMS personas when present, otherwise live archetype list (N, not capped). */
export function resumeVettingArchetypeOptions(
  personas: ResumeAdminPersona[] | undefined
): { value: string; label: string }[] {
  const fromCms = (personas ?? [])
    .filter((p) => filled(p.id) && (filled(p.name) || filled(p.label)))
    .map((p) => ({ value: p.id, label: (p.name || p.label).trim() }));
  if (fromCms.length) return fromCms;
  return Object.values(PERSONA_ARCHETYPES).map((a) => ({ value: a.id, label: a.name }));
}

function storedQuizAsAdmin(stored: ResumeAdminPayload): ResumeAdminQuizStep[] | undefined {
  if (Array.isArray(stored.quiz) && stored.quiz.length) return stored.quiz;
  if (Array.isArray(stored.quizSteps) && stored.quizSteps.length) {
    return stored.quizSteps.map((step, i) => ({
      id: step.id,
      question: step.question,
      sub: step.sub,
      options: (step.options ?? []).map((opt, j) => ({
        id: `${step.id || `q${i}`}-opt-${j}`,
        label: opt.label,
        value: opt.value,
      })),
    }));
  }
  return undefined;
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

  const personas = mergeResumeAdminPersonas(stored.personas, seeded.personas ?? []);
  const quiz = mergeResumeAdminQuiz(storedQuizAsAdmin(stored), seeded.quiz ?? []);
  const quizSteps = adminQuizToQuizSteps(quiz);

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
    pageHero: mergePageHero(stored.pageHero),
    quizSection: mergeQuizSection(stored.quizSection),
    industryMapSection: mergeSectionCopy(stored.industryMapSection, DEFAULT_RESUME_INDUSTRY_MAP_SECTION),
    templatesSection: mergeSectionCopy(stored.templatesSection, DEFAULT_RESUME_TEMPLATES_SECTION),
    positioningPrinciple: mergePositioningPrinciple(stored.positioningPrinciple),
    templateCardDetails: mergeTemplateCardDetails(stored.templateCardDetails),
  };
}

export function resolvePublicResumePageCopy(payload: ResumeAdminPayload) {
  return {
    pageHero: mergePageHero(payload.pageHero),
    quizSection: mergeQuizSection(payload.quizSection),
    industryMapSection: mergeSectionCopy(payload.industryMapSection, DEFAULT_RESUME_INDUSTRY_MAP_SECTION),
    templatesSection: mergeSectionCopy(payload.templatesSection, DEFAULT_RESUME_TEMPLATES_SECTION),
    positioningPrinciple: mergePositioningPrinciple(payload.positioningPrinciple),
    templateCardDetails: mergeTemplateCardDetails(payload.templateCardDetails),
  };
}
