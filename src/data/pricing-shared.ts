/** Career track subscription copy — landing, in-app gates, and upgrade prompts */
export const UPGRADE_TO_ACCESS = "Unlock" as const;

export const PRO_SUBSCRIPTION = {
  price: "SGD 59",
  period: "per month",
  note: "cancel anytime",
  label: "SGD 59/month",
  fullNote: "Unlock the full playbook, resume templates, career roadmap, and more.",
  cta: UPGRADE_TO_ACCESS,
  unlockCta: UPGRADE_TO_ACCESS,
} as const;

export const ELITE_SUBSCRIPTION = {
  price: "SGD 99",
  period: "per month",
  note: "cancel anytime",
  label: "SGD 99/month",
  fullNote: "Unlock case studies, Mentor Connect, the Desk Channel, and job openings.",
  cta: UPGRADE_TO_ACCESS,
  unlockCta: UPGRADE_TO_ACCESS,
} as const;

/** Sales track subscription copy — landing sales panel */
export const SALES_PRO_SUBSCRIPTION = {
  price: "SGD 99",
  period: "per month",
  label: "SGD 99/month",
  fullNote: "SGD 99/month — cancel anytime",
  cta: "Get Pro",
} as const;

export const SALES_ELITE_SUBSCRIPTION = {
  price: "SGD 199",
  period: "per month",
  label: "SGD 199/month",
  fullNote: "SGD 199/month — cancel anytime",
  cta: "Get Elite",
} as const;

/** Shared pricing copy — career and sales landing pages stay in sync */
export const PRICING_HERO = {
  eyebrow: "Simple Pricing",
  title: "Simple pricing",
  subtitle:
    "No lock-in on Pro and Elite. Cancel anytime. The only commitment is to getting ahead.",
};

export const PRICING_CONTENT_FOOTNOTE = "*New contents updated on periodic basis";

export const PRICING_CTA = {
  title: "Not sure yet? Join free.",
  description: "Get the Starter pack instantly — no card required. Upgrade when the time is right.",
  button: "Join Free",
};
