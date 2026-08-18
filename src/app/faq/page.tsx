import { getFaqContent } from "@/lib/content/accessors";
import { FaqClient } from "./faq-client";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${BRAND_NAME} plans, billing, and access.`,
};

export default async function FaqPage() {
  const content = await getFaqContent();
  return (
    <FaqClient hero={content.hero} items={content.items} footerCta={content.footerCta} />
  );
}
