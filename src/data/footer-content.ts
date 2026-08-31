import { CAREER_PRICING_HREF, SALES_PRICING_HREF } from "@/lib/pricing-routes";
import { BRAND_EMAIL_HELLO } from "@/lib/brand";

export type FooterLinkAction = "link" | "contact" | "mailto";

export interface FooterLinkItem {
  label: string;
  href: string;
  action?: FooterLinkAction;
}

export interface SiteFooterContent {
  blurb: string;
  columns: {
    contents: FooterLinkItem[];
    community: FooterLinkItem[];
    access: FooterLinkItem[];
  };
}

export const DEFAULT_SITE_FOOTER: SiteFooterContent = {
  blurb:
    "The definitive guide on commodity trading — for professionals breaking in, and for vendors selling into the industry.",
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
      { label: "FAQ", href: "/faq" },
    ],
    access: [
      { label: "Be a Member", href: CAREER_PRICING_HREF },
      { label: "Be a Partner", href: "#contact", action: "contact" },
      { label: "Team Licenses", href: `mailto:${BRAND_EMAIL_HELLO}`, action: "mailto" },
      { label: "Sign Up", href: "/signup" },
      { label: "Login", href: "/login" },
      { label: "Support", href: "#contact", action: "contact" },
    ],
  },
};
