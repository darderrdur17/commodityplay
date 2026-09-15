import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContentTierForSlug, getDeskChannelData } from "@/lib/content/accessors";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { DeskChannelClient } from "./desk-channel-client";

export const metadata = { title: "Desk Channel" };

export default async function DeskChannelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/desk-channel");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });
  if (!user) redirect("/login");

  const [desk, requiredTier] = await Promise.all([
    getDeskChannelData(),
    getContentTierForSlug("desk-channel"),
  ]);
  return (
    <DeskChannelClient
      userTier={user.tier}
      categories={desk.categories}
      questions={desk.questions}
      pageCopy={desk.pageCopy}
      lastRefreshed={desk.lastRefreshed}
      requiredTier={requiredTier as "PRO" | "ELITE"}
    />
  );
}
