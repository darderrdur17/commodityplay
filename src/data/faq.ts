import { BRAND_EMAIL_HELLO, BRAND_EMAIL_SUPPORT } from "@/lib/brand";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqHero {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface FaqFooterCta {
  heading: string;
  subtext: string;
  email: string;
  buttonLabel: string;
}

export interface FaqContent {
  hero: FaqHero;
  items: FaqItem[];
  footerCta: FaqFooterCta;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Can I upgrade from Starter or Pro later?",
    a: "Yes — you can upgrade at any time. When upgrading to Pro or Elite, your subscription starts immediately. Cancel either plan anytime.",
  },
  {
    q: "Can I cancel Pro or Elite anytime?",
    a: "Yes. Pro and Elite are monthly subscriptions — cancel anytime from your account. Your access continues until the end of the current billing period.",
  },
  {
    q: "What happens to my Pro content if I cancel Elite?",
    a: "Your Pro access remains active while your Pro subscription is active. Elite-only features (case studies, Desk Channel, Mentor Connect, job openings) are removed when Elite is cancelled.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards via Stripe. Pro and Elite are billed monthly on the same date each month.",
  },
  {
    q: "Is there a student or team discount?",
    a: `Yes — reach out to ${BRAND_EMAIL_HELLO} for student pricing or team licences for 5+ seats.`,
  },
  {
    q: "How does the Mentor Connect credit work?",
    a: "Elite members receive mentor credits each month (quantity TBD at launch). Each credit allows one question to one anonymous practitioner across 5 desk segments.",
  },
];

export const FAQ_HERO: FaqHero = {
  eyebrow: "Support",
  title: "Frequently asked questions",
  subtitle: "Everything you need to know about plans, billing, and access.",
};

export const FAQ_FOOTER_CTA: FaqFooterCta = {
  heading: "Still have questions?",
  subtext: `Email us at ${BRAND_EMAIL_SUPPORT}.`,
  email: BRAND_EMAIL_SUPPORT,
  buttonLabel: "Contact Us",
};

export const DEFAULT_FAQ_CONTENT: FaqContent = {
  hero: FAQ_HERO,
  items: FAQ_ITEMS,
  footerCta: FAQ_FOOTER_CTA,
};
