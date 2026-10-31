import { CAREER_PRICING_HREF, SALES_PRICING_HREF } from "@/lib/pricing-routes";
import { BRAND_EMAIL_HELLO, BRAND_EMAIL_SUPPORT } from "@/lib/brand";
import { DEFAULT_LEGAL_PAGES, type FooterLegalPages } from "@/data/legal-content";

export type FooterLinkAction = "link" | "contact" | "mailto";

/**
 * The FAQ is a SECTION at the foot of `/pricing`, not its own page any more
 * (owner request, 11 Oct 2026). `/faq` now 308-redirects here.
 *
 * Exported because the link is written in two places that must agree: this
 * default, and the migration in `normalizeFooterLink` that repairs an already
 * saved `site-footer` payload. CMS values beat repo defaults, so the default
 * alone would never reach the live footer.
 */
export const FAQ_SECTION_HREF = "/pricing#faq";

export interface FooterLinkItem {
  label: string;
  href: string;
  action?: FooterLinkAction;
}

export interface SiteFooterNewsletter {
  heading: string;
  subtext: string;
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
}

export interface SiteFooterContent {
  blurb: string;
  newsletter: SiteFooterNewsletter;
  columns: {
    contents: FooterLinkItem[];
    community: FooterLinkItem[];
    access: FooterLinkItem[];
  };
  /** Footer bar links + body copy for /privacy and /terms. */
  legal: FooterLegalPages;
  /** Inboxes that receive newsletter, Contact Us, mentor apply, and member signup alerts. */
  operatorNotifyEmails: string[];
}

export const DEFAULT_SITE_FOOTER: SiteFooterContent = {
  blurb:
    "The definitive guide on commodity trading — for professionals breaking in, and for vendors selling into the industry.",
  newsletter: {
    heading: "Stay close to the desk.",
    subtext: "One short email from the desk — industry happenings. No account needed.",
    placeholder: "your@email.com",
    buttonLabel: "I'm in →",
    successMessage: "You're on the list!",
  },
  columns: {
    contents: [
      { label: "Career Track", href: "/?track=career" },
      { label: "Sales Track", href: "/?track=sales" },
    ],
    community: [
      { label: "Mentor Connect", href: "/mentor-connect" },
      { label: "Desk Channel", href: "/desk-channel" },
      { label: "Job Board", href: "/waitlist" },
      { label: "Glossary", href: "/glossary" },
      { label: "FAQ", href: FAQ_SECTION_HREF },
    ],
    access: [
      { label: "Be a Member", href: CAREER_PRICING_HREF },
      { label: "Be a Mentor", href: "/mentor-apply" },
      { label: "Be a Partner", href: "#contact", action: "contact" },
      { label: "Team Licenses", href: `mailto:${BRAND_EMAIL_HELLO}`, action: "mailto" },
      { label: "Sign Up", href: "/signup" },
      { label: "Login", href: "/login" },
      { label: "Support", href: "#contact", action: "contact" },
    ],
  },
  legal: DEFAULT_LEGAL_PAGES,
  operatorNotifyEmails: [BRAND_EMAIL_SUPPORT],
};
