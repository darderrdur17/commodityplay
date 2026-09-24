import { z } from "zod";
import { DEFAULT_SITE_FOOTER, type FooterLinkItem, type SiteFooterContent } from "@/data/footer-content";
import { BRAND_EMAIL_SUPPORT } from "@/lib/brand";
import { deepMerge } from "@/lib/content/merge";
import { normalizeLegalPages } from "@/data/legal-content";

const footerLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  action: z.enum(["link", "contact", "mailto"]).optional(),
});

const siteFooterNewsletterSchema = z.object({
  heading: z.string().min(1),
  subtext: z.string().min(1),
  placeholder: z.string().min(1),
  buttonLabel: z.string().min(1),
  successMessage: z.string().min(1),
});

const legalSectionSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
});

const legalPageSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  pageTitle: z.string().min(1),
  lastUpdated: z.string().min(1),
  sections: z.array(legalSectionSchema).min(1),
});

export const siteFooterSchema = z.object({
  blurb: z.string().min(1),
  newsletter: siteFooterNewsletterSchema,
  columns: z.object({
    contents: z.array(footerLinkSchema).min(1),
    community: z.array(footerLinkSchema).min(1),
    access: z.array(footerLinkSchema).min(1),
  }),
  legal: z.object({
    privacy: legalPageSchema,
    terms: legalPageSchema,
  }),
  operatorNotifyEmails: z.array(z.string().email()).min(1).max(20),
});

const emailCheck = z.string().email();

export function normalizeOperatorNotifyEmails(raw?: string[] | null): string[] {
  const list = [
    ...new Set(
      (raw ?? [])
        .map((email) => email.trim().toLowerCase())
        .filter((email) => emailCheck.safeParse(email).success)
    ),
  ];
  const unique = list.length > 0 ? list : [BRAND_EMAIL_SUPPORT];
  return unique.slice(0, 20);
}

const MENTOR_APPLY_HREF = "/mentor-apply";
const BE_A_MENTOR_LINK: FooterLinkItem = { label: "Be a Mentor", href: MENTOR_APPLY_HREF };

function normalizeFooterLink(link: FooterLinkItem): FooterLinkItem {
  const label = link.label.trim();
  if (/^job board$/i.test(label) && /job-openings/i.test(link.href)) {
    return { ...link, href: "/waitlist" };
  }
  // Always a real page — never inherit CMS "contact" action from Support/Partner copies.
  if (/^be a mentor$/i.test(label)) {
    return { ...BE_A_MENTOR_LINK };
  }
  return link;
}

function ensureBeAMentorLink(links: FooterLinkItem[]): FooterLinkItem[] {
  const normalized = links.map(normalizeFooterLink);
  const mentor = BE_A_MENTOR_LINK;
  const withoutMentor = normalized.filter((l) => !/^be a mentor$/i.test(l.label.trim()));
  const memberIdx = withoutMentor.findIndex((l) => /^be a member$/i.test(l.label.trim()));
  const insertAt = memberIdx >= 0 ? memberIdx + 1 : 0;
  return [...withoutMentor.slice(0, insertAt), mentor, ...withoutMentor.slice(insertAt)];
}

function normalizeFooterColumns(columns: SiteFooterContent["columns"]): SiteFooterContent["columns"] {
  return {
    contents: columns.contents.map(normalizeFooterLink),
    community: columns.community.map(normalizeFooterLink),
    access: ensureBeAMentorLink(columns.access),
  };
}

export function mergeSiteFooterContent(
  cms: Partial<SiteFooterContent> | null | undefined
): SiteFooterContent {
  if (!cms) return DEFAULT_SITE_FOOTER;
  const merged = deepMerge(
    DEFAULT_SITE_FOOTER as unknown as Record<string, unknown>,
    cms as unknown as Record<string, unknown>
  ) as unknown as SiteFooterContent;
  return {
    ...merged,
    columns: normalizeFooterColumns(merged.columns ?? DEFAULT_SITE_FOOTER.columns),
    legal: normalizeLegalPages(merged.legal),
    operatorNotifyEmails: normalizeOperatorNotifyEmails(merged.operatorNotifyEmails),
  };
}

export function prepareSiteFooterForSave(payload: unknown) {
  const merged = mergeSiteFooterContent(payload as Partial<SiteFooterContent>);
  return siteFooterSchema.safeParse(merged);
}

export function formatSiteFooterValidationErrors(
  result: ReturnType<typeof prepareSiteFooterForSave>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}
