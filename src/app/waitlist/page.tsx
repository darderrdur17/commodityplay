import { getLandingContent } from "@/lib/content/accessors";
import { BRAND_NAME } from "@/lib/brand";
import { WaitlistClient } from "./waitlist-client";

/**
 * The Job Board Waitlist page.
 *
 * This is a thin SERVER component: it loads the CMS copy and hands it to the
 * client half (`waitlist-client.tsx`), the same split `/pricing` uses. The copy
 * lives in the `landing` module's `waitlist` group — the landing module already
 * carries groups that feed other pages, so no new module was created for it.
 *
 * `force-dynamic` because it reads the CMS content on every request.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: `Job Board Waitlist — ${BRAND_NAME}`,
  description:
    "Join the waitlist for the curated commodity trading job board — get an email when it launches.",
};

export default async function WaitlistPage() {
  const content = await getLandingContent();
  return <WaitlistClient copy={content.waitlist} />;
}
