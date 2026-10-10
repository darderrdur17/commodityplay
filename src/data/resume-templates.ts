import resumeExtras from "./resume-extras.json";

export interface ResumeTemplate {
  id: string;
  persona: string;
  label: string;
  roleBand: string;
  positioningChallenge: string;
  templateFile: string;
  keyMove?: string;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "switcher",
    persona: "CAREER_SWITCHER",
    label: "The Switcher",
    roleBand: "Banking · Management Consulting · Engineering · O&G Technical",
    positioningChallenge:
      "You have relevant skills but they are buried under the wrong language. Your financial modelling reads as banking, your project management reads as consulting. The template reframes everything using commodity trading vocabulary.",
    templateFile: "switcher_resume_template.docx",
    keyMove: "Translate every bullet into physical-market language — cargoes, spreads, hedges, not generic finance.",
  },
  {
    id: "insider",
    persona: "INSIDER",
    label: "The Insider",
    roleBand: "Scheduling · Operations · ETRM · Logistics · Trade Support",
    positioningChallenge:
      "Your operational experience is genuinely valuable — but it reads as execution, not commercial. The template reframes operational knowledge as the execution-to-commercial bridge that desk candidates can't offer.",
    templateFile: "insider_resume_template.docx",
    keyMove: "Quantify the commercial impact of operational decisions — demurrage saved, cargoes diverted, exposure reduced.",
  },
  {
    id: "analyst",
    persona: "ANALYST_TRADER",
    label: "Analyst-to-Trader",
    roleBand: "Analytics · Quantitative Research · Data Science · Risk Modelling",
    positioningChallenge:
      "Strongest technical profile, weakest commercial narrative. Models need P&L implications. The template shows you as quantitative commercial — someone who builds models to take positions, not just to report on them.",
    templateFile: "analyst_trader_resume_template.docx",
    keyMove: "Attach a market view to every model — what position would you take and why?",
  },
  {
    id: "vendor",
    persona: "VENDOR",
    label: "The Vendor",
    roleBand: "Platts · Argus · ICIS · Kpler · Vortexa · Wood Mackenzie",
    positioningChallenge:
      "Vendor candidates almost always write a sales resume for a market knowledge role. Remove revenue targets. Replace with: what market you covered, what analysis you produced, and what decision it enabled inside a trading firm.",
    templateFile: "vendor_resume_template.docx",
    keyMove: "Lead with market coverage and client decisions enabled — not quota attainment.",
  },
  {
    id: "fresh_grad",
    persona: "FRESH_GRAD",
    label: "Fresh Graduate",
    roleBand: "Undergraduate · Postgraduate · 0–2 Years Experience",
    positioningChallenge:
      "No trading experience is expected — but commercial curiosity is non-negotiable. The template shows you understand the market and have already started engaging with it before your first role.",
    templateFile: "fresh_grad_resume_template.docx",
    keyMove:
      "Pick one entry track (analytics, scheduling/ops, or risk) and build one piece of market evidence — an EIA tracker, a market view, or a Python analysis script.",
  },
];

export const PERSONA_QUIZ_QUESTIONS = [
  {
    id: "background",
    question: "What best describes your current background?",
    options: [
      { value: "switcher", label: "Banking, consulting, or engineering moving into commodities" },
      { value: "insider", label: "Operations, scheduling, logistics, or trade support" },
      { value: "analyst", label: "Analytics, quant, data science, or risk modelling" },
      { value: "vendor", label: "Price reporting, data vendor, or market intelligence" },
      { value: "fresh_grad", label: "Student or early-career graduate" },
    ],
  },
];

export interface QuizStepOption {
  value: string;
  label: string;
  sub?: string;
  persona?: string;
}

export interface PersonaQuizStep {
  id: string;
  question: string;
  sub: string;
  options: QuizStepOption[];
}

export interface IndustryMapZone {
  zone: string;
  title: string;
  color: string;
  muted?: boolean;
  roles: { name: string; tag?: string; dotColor?: string }[];
}

export interface TemplatePreviewSection {
  label: string;
  accent?: boolean;
  barWidths: number[];
}

export interface TemplateCardDetails {
  title: string;
  whoThisIsFor: string;
  highlights: string[];
  previewTagline: string;
  previewSections: TemplatePreviewSection[];
}

export interface ResumeVettingFormLabels {
  name: string;
  email: string;
  archetype: string;
  yearsExperience: string;
  targetRole: string;
  upload: string;
  uploadHint: string;
  uploadLimit: string;
  submit: string;
}

export interface ResumeVettingSection {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  benefits: string[];
  includedLabel: string;
  includedNote: string;
  formTitle: string;
  formSubtitle: string;
  labels: ResumeVettingFormLabels;
  successTitle: string;
  successMessage: string;
}

export const RESUME_VETTING_ARCHETYPE_OPTIONS = [
  { value: "switcher", label: "The Switcher" },
  { value: "insider", label: "The Insider" },
  { value: "analyst", label: "Analyst-to-Trader" },
  { value: "vendor", label: "The Vendor" },
  { value: "none", label: "None of the Above" },
] as const;

export const PERSONA_QUIZ_STEPS: PersonaQuizStep[] = resumeExtras.quizSteps as PersonaQuizStep[];
export const INDUSTRY_MAP: IndustryMapZone[] = resumeExtras.industryMap as IndustryMapZone[];
export const RESUME_VETTING_SECTION: ResumeVettingSection = (
  resumeExtras as { vettingSection?: ResumeVettingSection }
).vettingSection ?? {
  eyebrow: "Online Resume Vetting · Pro Feature",
  headline: "Get Your Resume",
  headlineAccent: "Reviewed by a Practitioner.",
  intro:
    "Submit your completed resume — using any of the five templates — and a commodity trading practitioner from our network will review it and provide written feedback within 5 business days.",
  benefits: [
    "Line-by-line commercial language assessment — does every bullet demonstrate market awareness?",
    "Archetype positioning check — is the resume consistent with the archetype strategy?",
    "Top 3 improvements — specific, actionable rewrites to the weakest sections",
    "Recruiter readability score — how fast does the key message land?",
    "Written feedback delivered as annotated PDF within 5 business days",
  ],
  includedLabel: "Included in",
  includedNote:
    "Pro Pack subscribers get 2 resume vetting reviews per year — included in your USD 19/month subscription. Starter members can purchase additional reviews at SGD 49 per review.",
  formTitle: "Submit for Review",
  formSubtitle: "Pro members · 2 reviews included · 5 business day turnaround",
  labels: {
    name: "Full Name",
    email: "Email Address",
    archetype: "Your Archetype",
    yearsExperience: "Years of Experience",
    targetRole: "Target Role",
    upload: "Upload Your Resume",
    uploadHint: "Click to upload your resume · .docx or .pdf",
    uploadLimit: "Maximum 5MB · .docx or PDF · One file only",
    submit: "Submit for Review",
  },
  successTitle: "Resume submitted.",
  successMessage:
    "You'll receive your annotated feedback within 5 business days at the email address provided. Check your inbox — including spam — for confirmation.",
};

export function mergeResumeVettingSection(
  cms: Partial<ResumeVettingSection> | null | undefined,
  defaults: ResumeVettingSection = RESUME_VETTING_SECTION
): ResumeVettingSection {
  const raw = cms ?? {};
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    headline: raw.headline?.trim() || defaults.headline,
    headlineAccent: raw.headlineAccent?.trim() || defaults.headlineAccent,
    intro: raw.intro?.trim() || defaults.intro,
    benefits: raw.benefits?.length ? raw.benefits : defaults.benefits,
    includedLabel: raw.includedLabel?.trim() || defaults.includedLabel,
    includedNote: raw.includedNote?.trim() || defaults.includedNote,
    formTitle: raw.formTitle?.trim() || defaults.formTitle,
    formSubtitle: raw.formSubtitle?.trim() || defaults.formSubtitle,
    labels: {
      ...defaults.labels,
      ...raw.labels,
    },
    successTitle: raw.successTitle?.trim() || defaults.successTitle,
    successMessage: raw.successMessage?.trim() || defaults.successMessage,
  };
}
export const POSITIONING_PRINCIPLE = (
  resumeExtras as {
    positioningPrinciple?: { title: string; body: string };
  }
).positioningPrinciple ?? {
  title: "The positioning principle that every template is built on",
  body: "Hiring managers in commodity trading do not read resumes looking for impressive job titles. They read them looking for evidence that you understand how physical markets work and that you can contribute commercially from day one. Every template in this pack is built around that single insight — commercial awareness over career narrative.",
};

export const TEMPLATE_CARD_DETAILS: Record<string, TemplateCardDetails> = {
  switcher: {
    title: "Coming From Finance, Consulting, or Engineering",
    whoThisIsFor:
      "Professionals with 2–8 years of experience in banking, consulting, engineering, or O&G technical roles who are targeting a transition into commodity trading or a commercial role at an energy firm.",
    highlights: [
      "Market Knowledge section placed above work experience — your commercial awareness leads, not your job history",
      "Pre-built bullet formula prompts: [what you analysed] + [market signal] + [commercial action]",
      "Amber accent colour signals cross-industry credibility without screaming \"outsider\"",
      "Guidance notes throughout explain the positioning logic behind each section",
      "Skills section uses commodity-specific terms (Platts, crack spreads, EFS, JKM) not generic finance jargon",
    ],
    previewTagline: "THE SWITCHER — Cross-Industry Commercial Positioning",
    previewSections: [
      { label: "Market Knowledge", accent: true, barWidths: [90, 70, 80] },
      { label: "Professional Experience", barWidths: [90, 60, 80, 50] },
      { label: "Education · Skills", barWidths: [70, 50] },
    ],
  },
  insider: {
    title: "Already Inside the Industry, Moving Toward the Desk",
    whoThisIsFor:
      "Professionals already working inside a commodity trading firm in a non-desk function who want to move into a commercial, trading, or analytics role within the same firm or at a competitor.",
    highlights: [
      "Commercial & Desk Interaction section — places evidence of front-office exposure above operational detail",
      "Bullet prompts use \"supported trading desk in…\" and \"flagged arbitrage opportunity that resulted in…\" language",
      "Teal accent positions the profile as credible industry insider, not a lateral transfer",
      "ETRM systems prominently featured — signals operational depth that analytical candidates lack",
      "Framing guidance: \"execution-to-commercial bridge\" — you know how deals land, not just how they're structured",
    ],
    previewTagline: "THE INSIDER — Ops-to-Commercial Positioning",
    previewSections: [
      { label: "Commercial & Desk Interaction", accent: true, barWidths: [90, 70, 80] },
      { label: "Professional Experience", barWidths: [90, 60, 80, 50] },
    ],
  },
  analyst: {
    title: "Quant / Analytics Background Moving Toward the Desk",
    whoThisIsFor:
      "Analytics professionals, quantitative researchers, or data scientists with commodity market exposure who want to move into a front-office trading or senior analytics role with direct commercial impact.",
    highlights: [
      "Market Views section — 2–3 dated, specific calls you made and what happened (the key differentiator)",
      "Independent Project block for a GitHub data project — proves market engagement outside work",
      "Every model bullet ends with a commercial implication — not just what was built but what decision it enabled",
      "Technical tools woven into achievements, not listed in a skills block",
      "Purple signals analytical depth and commercial ambition simultaneously",
    ],
    previewTagline: "ANALYST-TO-TRADER — Quantitative Commercial",
    previewSections: [
      { label: "Market Views", accent: true, barWidths: [90, 70] },
      { label: "Experience · Independent Project", barWidths: [90, 60, 80] },
    ],
  },
  vendor: {
    title: "Market Intelligence Vendor Moving Into the Industry",
    whoThisIsFor:
      "Professionals at Platts, Argus, ICIS, Kpler, Vortexa, Wood Mac, or similar firms who have spent years advising trading desks and now want to join one — in an analytics, commercial, or intelligence role.",
    highlights: [
      "\"Your Hidden Edge\" advisory panel — explicitly unlocks the commercial value most vendor candidates undersell",
      "Market Knowledge & Commercial Insight section replaces a generic \"account management\" section",
      "Desk-Level Client Engagement section — shows the depth of relationship, not a headcount",
      "All revenue metrics removed and replaced with market intelligence outputs",
      "Cover letter hook guidance: open with a specific market observation from your coverage beat",
    ],
    previewTagline: "THE VENDOR — Market Intelligence to Desk",
    previewSections: [
      { label: "Market Knowledge & Insight", accent: true, barWidths: [90, 70, 80] },
      { label: "Experience · Desk Engagement", barWidths: [90, 60] },
    ],
  },
  fresh_grad: {
    title: "Student or Early-Career — Building the Foundation",
    whoThisIsFor:
      "Undergraduates, recent graduates, and professionals with 0–2 years of experience who want to enter the commodity trading industry — in any function — and need to demonstrate commercial curiosity without direct experience.",
    highlights: [
      "\"What Skills Do You Need?\" guidance panel — a gold callout box that maps graduates to their entry track before they fill in a single bullet",
      "Market Knowledge section prominently placed — your weekly EIA tracking or LNG price study goes here",
      "Independent Projects section — even a basic Excel crack spread model demonstrates real engagement",
      "Education elevated as primary section — coursework commercially reframed",
      "Entry track selector: Analytics, Scheduling/Ops, or Risk — choose one before applying",
    ],
    previewTagline: "FRESH GRADUATE — Entry-Level Positioning",
    previewSections: [
      { label: "Market Knowledge · Skills Guide", accent: true, barWidths: [90, 60] },
      { label: "Education · Projects · Activities", barWidths: [90, 70, 50] },
    ],
  },
};
