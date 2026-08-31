import { z } from "zod";
import { DEFAULT_SITE_FOOTER, type FooterLinkItem, type SiteFooterContent } from "@/data/footer-content";
import { deepMerge } from "@/lib/content/merge";

const footerLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  action: z.enum(["link", "contact", "mailto"]).optional(),
});

export const siteFooterSchema = z.object({
  blurb: z.string().min(1),
  columns: z.object({
    contents: z.array(footerLinkSchema).min(1),
    community: z.array(footerLinkSchema).min(1),
    access: z.array(footerLinkSchema).min(1),
  }),
});

function normalizeFooterLink(link: FooterLinkItem): FooterLinkItem {
  const label = link.label.trim();
  if (/^job board$/i.test(label) && /job-openings/i.test(link.href)) {
    return { ...link, href: "/waitlist" };
  }
  return link;
}

function normalizeFooterColumns(columns: SiteFooterContent["columns"]): SiteFooterContent["columns"] {
  return {
    contents: columns.contents.map(normalizeFooterLink),
    community: columns.community.map(normalizeFooterLink),
    access: columns.access.map(normalizeFooterLink),
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
