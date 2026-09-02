import { GLOSSARY_CATEGORIES } from "@/data/glossary";

export interface GlossaryHero {
  eyebrow: string;
  title: string;
  description: string;
  statChips: string[];
}

export interface GlossaryUpgradeCta {
  titlePrefix: string;
  titleAccent: string;
  titleSuffix: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface GlossaryPageContent {
  hero: GlossaryHero;
  upgradeCta: GlossaryUpgradeCta;
}

export const DEFAULT_GLOSSARY_HERO: GlossaryHero = {
  eyebrow: "Free Resource — Starter Pack",
  title: "The Desk Glossary",
  description:
    "Commodity trading terms, explained the way a senior trader would actually explain them to a new hire on day one — not Wikipedia definitions.",
  statChips: [
    "Terms",
    `${GLOSSARY_CATEGORIES.length} Categories`,
    "Trader explanations throughout",
    "Always updated",
  ],
};

export const DEFAULT_GLOSSARY_UPGRADE_CTA: GlossaryUpgradeCta = {
  titlePrefix: "Ready to go ",
  titleAccent: "deeper",
  titleSuffix: "?",
  description:
    "The Desk Glossary is just the start. The full Playbook covers commodity market mechanics, desk structure, career roadmaps, and deal teardowns — with the same practitioner voice throughout.",
  buttonLabel: "Get the Playbook",
  buttonHref: "/signup?plan=pro",
};

export const DEFAULT_GLOSSARY_PAGE_CONTENT: GlossaryPageContent = {
  hero: DEFAULT_GLOSSARY_HERO,
  upgradeCta: DEFAULT_GLOSSARY_UPGRADE_CTA,
};

export function mergeGlossaryHero(
  cms: Partial<GlossaryHero> | null | undefined,
  defaults: GlossaryHero = DEFAULT_GLOSSARY_HERO
): GlossaryHero {
  const raw = cms ?? {};
  const chips = raw.statChips?.map((c) => c.trim()).filter(Boolean);
  return {
    eyebrow: raw.eyebrow?.trim() || defaults.eyebrow,
    title: raw.title?.trim() || defaults.title,
    description: raw.description?.trim() || defaults.description,
    statChips: chips?.length ? chips : defaults.statChips,
  };
}

export function mergeGlossaryUpgradeCta(
  cms: Partial<GlossaryUpgradeCta> | null | undefined,
  defaults: GlossaryUpgradeCta = DEFAULT_GLOSSARY_UPGRADE_CTA
): GlossaryUpgradeCta {
  const raw = cms ?? {};
  return {
    titlePrefix: raw.titlePrefix?.trim() || defaults.titlePrefix,
    titleAccent: raw.titleAccent?.trim() || defaults.titleAccent,
    titleSuffix: raw.titleSuffix?.trim() || defaults.titleSuffix,
    description: raw.description?.trim() || defaults.description,
    buttonLabel: raw.buttonLabel?.trim() || defaults.buttonLabel,
    buttonHref: raw.buttonHref?.trim() || defaults.buttonHref,
  };
}

export function mergeGlossaryPageContent(
  cms: Partial<GlossaryPageContent> | null | undefined
): GlossaryPageContent {
  return {
    hero: mergeGlossaryHero(cms?.hero),
    upgradeCta: mergeGlossaryUpgradeCta(cms?.upgradeCta),
  };
}
