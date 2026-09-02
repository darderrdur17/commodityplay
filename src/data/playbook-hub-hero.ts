export interface PlaybookHubHeroCopy {
  proBadge: string;
  proTitle: string;
  /** Supports {chapterCount} and {sectionCount} placeholders. */
  proDescription: string;
  previewBadge: string;
  previewTitle: string;
  previewDescription: string;
}

export const DEFAULT_PLAYBOOK_HUB_HERO: PlaybookHubHeroCopy = {
  proBadge: "Pro Access",
  proTitle: "The Full Playbook",
  proDescription:
    "{chapterCount} Chapters. {sectionCount} sections. Industry foundations through commercial decision-making — sourced from the Pro Pack playbook.",
  previewBadge: "Chapter A · Free Preview",
  previewTitle: "Industry Foundations",
  previewDescription:
    "Chapter A preview — {starterPreviewLabel}. The ground-level understanding every serious learner of commodity trading needs before anything else.",
};

export function mergePlaybookHubHero(
  cms: Partial<PlaybookHubHeroCopy> | null | undefined,
  defaults: PlaybookHubHeroCopy = DEFAULT_PLAYBOOK_HUB_HERO
): PlaybookHubHeroCopy {
  const raw = cms ?? {};
  return {
    proBadge: raw.proBadge?.trim() || defaults.proBadge,
    proTitle: raw.proTitle?.trim() || defaults.proTitle,
    proDescription: raw.proDescription?.trim() || defaults.proDescription,
    previewBadge: raw.previewBadge?.trim() || defaults.previewBadge,
    previewTitle: raw.previewTitle?.trim() || defaults.previewTitle,
    previewDescription: raw.previewDescription?.trim() || defaults.previewDescription,
  };
}
