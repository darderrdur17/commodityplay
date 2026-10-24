import { getMentorApplyPageCopy } from "@/lib/content/accessors";
import { canonicalAlternates } from "@/lib/seo";
import { MentorApplyForm } from "./mentor-apply-form";

/**
 * Public page (listed in `sitemap.ts`), so it needs its own canonical. It had no
 * metadata block at all before, which meant it inherited the root title and had no
 * canonical — the one public route Google could index with no identity of its own.
 */
export const metadata = {
  // ⚠️ No `${BRAND_NAME}`: the layout's `title.template` appends "| CommodityPlay.".
  title: "Become a mentor",
  description:
    "Apply to mentor members of the CommodityPlay community — share how you built your desk, and help the next person in.",
  alternates: canonicalAlternates("/mentor-apply"),
};

export default async function MentorApplyPage() {
  const copy = await getMentorApplyPageCopy();
  return <MentorApplyForm copy={copy} />;
}
