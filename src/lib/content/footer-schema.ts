import { z } from "zod";
import { DEFAULT_SITE_FOOTER, type FooterLinkItem, type SiteFooterContent } from "@/data/footer-content";
import { deepMerge } from "@/lib/content/merge";

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

export const siteFooterSchema = z.object({
  blurb: z.string().min(1),
  newsletter: siteFooterNewsletterSchema,
  columns: z.object({
    contents: z.array(footerLinkSchema).min(1),
    community: z.array(footerLinkSchema).min(1),
    access: z.array(footerLinkSchema).min(1),
  }),
});

const MENTOR_APPLY_HREF = "/mentor-apply";
const BE_A_MENTOR_LINK: FooterLinkItem = { label: "Be a Mentor", href: MENTOR_APPLY_HREF };

function normalizeFooterLink(link: FooterLinkItem): FooterLinkItem {
  const label = link.label.trim();
  if (/^job board$/i.test(label) && /job-openings/i.test(link.href)) {
    return { ...link, href: "/waitlist" };
  }
  if (/^be a mentor$/i.test(label)) {
    return { ...link, href: MENTOR_APPLY_HREF };
  }
  return link;
}

function ensureBeAMentorLink(links: FooterLinkItem[]): FooterLinkItem[] {
  const normalized = links.map(normalizeFooterLink);
  let mentor = normalized.find((l) => /^be a mentor$/i.test(l.label.trim()));
  const withoutMentor = normalized.filter((l) => !/^be a mentor$/i.test(l.label.trim()));
  if (!mentor) {
    mentor = BE_A_MENTOR_LINK;
  }
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
