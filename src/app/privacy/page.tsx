import { getSiteFooterContent } from "@/lib/content/accessors";
import { LegalDocument } from "@/components/legal-document";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const footer = await getSiteFooterContent();
  return {
    title: footer.legal.privacy.pageTitle,
    description: `How ${BRAND_NAME} collects, uses, and protects your personal data.`,
  };
}

export default async function PrivacyPage() {
  const footer = await getSiteFooterContent();
  return (
    <LegalDocument
      page={footer.legal.privacy}
      otherHref={footer.legal.terms.href}
      otherLabel={footer.legal.terms.pageTitle}
    />
  );
}
