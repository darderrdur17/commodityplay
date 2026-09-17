export interface MentorApplyHeroCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface MentorApplyPageCopy {
  hero: MentorApplyHeroCopy;
  detailsHeading: string;
  backgroundHeading: string;
  mentorOnHeading: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  linkedInLabel: string;
  linkedInPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  companyLabel: string;
  companyPlaceholder: string;
  roleLabel: string;
  rolePlaceholder: string;
  yearsLabel: string;
  yearsPlaceholder: string;
  commodityLabel: string;
  commodityPlaceholder: string;
  headlineLabel: string;
  headlinePlaceholder: string;
  bioLabel: string;
  bioPlaceholder: string;
  tagsLabel: string;
  tagsPlaceholder: string;
  confirmText: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  topics: string[];
}

export const DEFAULT_MENTOR_APPLY_TOPICS = [
  "Commodity fundamentals",
  "Trading strategy",
  "Risk management",
  "Market analysis",
  "Career development",
  "Sales / BD",
  "Physical trading",
  "Derivatives",
  "LNG / Gas",
  "Oil",
  "Power",
];

export const DEFAULT_MENTOR_APPLY_PAGE_COPY: MentorApplyPageCopy = {
  hero: {
    eyebrow: "Invitation only",
    title: "Mentor Application",
    description:
      "Fill in your details below. We will review your profile and once confirmed, you'll receive an email to login account. Fields marked with * are shown publicly on Mentor Connect under your anonymous ID. Name, company, linkedin, and email stay internal.",
  },
  detailsHeading: "Your details",
  backgroundHeading: "Professional background",
  mentorOnHeading: "What can you mentor on?",
  nameLabel: "Full name",
  namePlaceholder: "Alex Chen",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  linkedInLabel: "LinkedIn profile",
  linkedInPlaceholder: "https://linkedin.com/in/yourprofile",
  locationLabel: "Current location",
  locationPlaceholder: "Singapore",
  companyLabel: "Company / Organisation",
  companyPlaceholder: "e.g. the entity name you are employed at",
  roleLabel: "Current / most recent role",
  rolePlaceholder: "e.g. Senior Crude Oil Trader",
  yearsLabel: "Years of experience",
  yearsPlaceholder: "e.g. 20",
  commodityLabel: "Primary commodity focus",
  commodityPlaceholder: "e.g. Gasoil, LNG, Power, Base Metals",
  bioLabel: "Tell us about your experience",
  bioPlaceholder:
    "Brief overview of your commodity market background, desks / functions you've worked on, and you're best placed to mentor on...",
  headlineLabel: "Professional headline",
  headlinePlaceholder: "e.g. Crude Oil Trader — Ex-Supermajor",
  tagsLabel: "Mentorship subjects",
  tagsPlaceholder: "e.g. Crude oil, Forward curves, Physical arbitrage",
  confirmText:
    "I confirm that the information provided is accurate and I'm open to being contacted regarding participation as an anonymous mentor on CommodityPlay.",
  submitLabel: "Submit application",
  successTitle: "Application submitted",
  successBody:
    "Thanks — your details have been sent for review. We'll reach out directly if your profile is approved for Mentor Connect.",
  topics: [...DEFAULT_MENTOR_APPLY_TOPICS],
};

function filled(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function mergeMentorApplyPageCopy(
  cms?: Partial<Omit<MentorApplyPageCopy, "hero">> & {
    hero?: Partial<MentorApplyHeroCopy> | null;
    topics?: string[] | null;
  } | null
): MentorApplyPageCopy {
  const d = DEFAULT_MENTOR_APPLY_PAGE_COPY;
  const topics = (cms?.topics ?? [])
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);
  return {
    hero: {
      eyebrow: filled(cms?.hero?.eyebrow, d.hero.eyebrow),
      title: filled(cms?.hero?.title, d.hero.title),
      description: filled(cms?.hero?.description, d.hero.description),
    },
    detailsHeading: filled(cms?.detailsHeading, d.detailsHeading),
    backgroundHeading: filled(cms?.backgroundHeading, d.backgroundHeading),
    mentorOnHeading: filled(cms?.mentorOnHeading, d.mentorOnHeading),
    nameLabel: filled(cms?.nameLabel, d.nameLabel),
    namePlaceholder: filled(cms?.namePlaceholder, d.namePlaceholder),
    emailLabel: filled(cms?.emailLabel, d.emailLabel),
    emailPlaceholder: filled(cms?.emailPlaceholder, d.emailPlaceholder),
    linkedInLabel: filled(cms?.linkedInLabel, d.linkedInLabel),
    linkedInPlaceholder: filled(cms?.linkedInPlaceholder, d.linkedInPlaceholder),
    locationLabel: filled(cms?.locationLabel, d.locationLabel),
    locationPlaceholder: filled(cms?.locationPlaceholder, d.locationPlaceholder),
    companyLabel: filled(cms?.companyLabel, d.companyLabel),
    companyPlaceholder: filled(cms?.companyPlaceholder, d.companyPlaceholder),
    roleLabel: filled(cms?.roleLabel, d.roleLabel),
    rolePlaceholder: filled(cms?.rolePlaceholder, d.rolePlaceholder),
    yearsLabel: filled(cms?.yearsLabel, d.yearsLabel),
    yearsPlaceholder: filled(cms?.yearsPlaceholder, d.yearsPlaceholder),
    commodityLabel: filled(cms?.commodityLabel, d.commodityLabel),
    commodityPlaceholder: filled(cms?.commodityPlaceholder, d.commodityPlaceholder),
    headlineLabel: filled(cms?.headlineLabel, d.headlineLabel),
    headlinePlaceholder: filled(cms?.headlinePlaceholder, d.headlinePlaceholder),
    bioLabel: filled(cms?.bioLabel, d.bioLabel),
    bioPlaceholder: filled(cms?.bioPlaceholder, d.bioPlaceholder),
    tagsLabel: filled(cms?.tagsLabel, d.tagsLabel),
    tagsPlaceholder: filled(cms?.tagsPlaceholder, d.tagsPlaceholder),
    confirmText: filled(cms?.confirmText, d.confirmText),
    submitLabel: filled(cms?.submitLabel, d.submitLabel),
    successTitle: filled(cms?.successTitle, d.successTitle),
    successBody: filled(cms?.successBody, d.successBody),
    topics: topics.length > 0 ? topics : [...d.topics],
  };
}
