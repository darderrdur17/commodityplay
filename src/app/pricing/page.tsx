import { getLandingContent } from "@/lib/content/accessors";
import { PricingPageClient } from "./pricing-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PricingPage() {
  const content = await getLandingContent();
  return (
    <PricingPageClient
      tiers={content.pricing.tiers}
      comparisonGroups={content.pricing.comparison.groups}
    />
  );
}
