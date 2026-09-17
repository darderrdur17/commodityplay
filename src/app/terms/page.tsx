import { getSiteFooterContent } from "@/lib/content/accessors";
import { LegalDocument } from "@/components/legal-document";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const footer = await getSiteFooterContent();
  return {
    title: footer.legal.terms.pageTitle,
    description: `Terms and conditions for using ${BRAND_NAME}.`,
  };
}

export default async function TermsPage() {
  const footer = await getSiteFooterContent();
  return (
    <LegalDocument
      page={footer.legal.terms}
      otherHref={footer.legal.privacy.href}
      otherLabel={footer.legal.privacy.pageTitle}
    />
  );
}
