import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContentTierForSlug, getDeskChannelData } from "@/lib/content/accessors";
import { hasAccess } from "@/lib/utils";
import { getEntitlements } from "@/lib/entitlements";
import { DeskChannelClient } from "./desk-channel-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Desk Channel" };

export default async function DeskChannelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/desk-channel");

  // AUTHORISATION: authoritative entitlement from the database. `session.user.tier`
  // (JWT) can be up to 30 days stale after a downgrade, refund or lapsed card.
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.exists) redirect("/login?callbackUrl=/desk-channel");

  const [desk, requiredTier] = await Promise.all([
    getDeskChannelData(),
    getContentTierForSlug("desk-channel"),
  ]);

  const tier = (requiredTier ?? "ELITE") as "PRO" | "ELITE";
  const hasDeskAccess = hasAccess(entitlements.tier, tier);

  return (
    <DeskChannelClient
      // The client-side TierGate uses this for the upsell UI only.
      userTier={entitlements.tier}
      categories={desk.categories}
      // PAYWALL: the full Elite Q&A corpus is filtered on the server. An unentitled
      // member receives zero question bytes — not blurred, not hidden, absent.
      questions={hasDeskAccess ? desk.questions : []}
      pageCopy={desk.pageCopy}
      lastRefreshed={hasDeskAccess ? desk.lastRefreshed : undefined}
      requiredTier={tier}
    />
  );
}
