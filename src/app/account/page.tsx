import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations";
import { TIER_LABELS, formatDate } from "@/lib/utils";
import { isAdminEmail } from "@/lib/admin-access";
import { resolveMemberPersonaLabel } from "@/lib/persona-display";
import { AccountBillingSection } from "@/components/account/account-billing-section";
import { isCheckoutConfigured } from "@/lib/payments";
import { getMentorCreditUsageForUser } from "@/lib/mentor-credits-server";
import { formatMentorCreditsUsedLabel } from "@/lib/mentor-credits";
import { isMentorAccount } from "@/lib/mentor-demo";
import { User, Mail, CreditCard, Sparkles, Inbox, CheckCircle, Clock } from "lucide-react";
import { MentorAccountSettings } from "@/components/account/mentor-account-settings";
import { MemberAccountSettings } from "@/components/account/member-account-settings";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
      track: true,
      persona: true,
      resumePersonaDone: true,
      company: true,
      profession: true,
      isMentor: true,
      mentorCredits: true,
      resumeCredits: true,
      stripeCurrentPeriodEnd: true,
      stripeStatus: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const isMentorUser = isMentorAccount(user);
  // DB-keyed, exactly like the entitlement override: never `session.user.role`.
  const isAdminUser = isAdminEmail(user.email);

  const mentorCreditUsage = isMentorUser
    ? null
    : await getMentorCreditUsageForUser(user);

  let mentorStats: { total: number; answered: number; pending: number } | null = null;
  if (isMentorUser) {
    const [total, answered] = await Promise.all([
      prisma.mentorQuestion.count({ where: { userId: { not: user.id } } }),
      prisma.mentorQuestion.count({ where: { userId: { not: user.id }, isAnswered: true } }),
    ]);
    mentorStats = { total, answered, pending: total - answered };
  }

  const tierInfo = TIER_LABELS[user.tier] || TIER_LABELS.STARTER;
  const personaLabel = resolveMemberPersonaLabel(user.track, user.persona, user.resumePersonaDone);

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Reveal>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Account</h1>
        <p className="text-muted-fg text-sm mb-8">Manage your membership and profile settings.</p>

        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
          <div className="p-6 border-b border-border flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-400 flex items-center justify-center text-white text-xl font-bold">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name || "Member"}</p>
              <p className="text-sm text-muted-fg">{user.email}</p>
            </div>
            <Badge
              variant={isMentorUser ? "mentor" : isAdminUser ? "elite" : user.tier === "ELITE" ? "elite" : user.tier === "PRO" ? "pro" : "starter"}
              className="ml-auto"
            >
              {isMentorUser ? "Mentor" : isAdminUser ? "Administrator" : tierInfo.label}
            </Badge>
          </div>

          <div className="divide-y divide-border">
            {(isMentorUser
              ? [
                  { icon: Sparkles, label: "Persona", value: personaLabel ?? "Not set" },
                  { icon: Inbox, label: "Total requests received", value: String(mentorStats?.total ?? 0) },
                  { icon: CheckCircle, label: "Requests answered", value: String(mentorStats?.answered ?? 0) },
                  { icon: Clock, label: "Pending requests", value: String(mentorStats?.pending ?? 0) },
                  { icon: Mail, label: "Date joined", value: formatDate(user.createdAt) },
                ]
              : [
              { icon: User, label: "Track", value: user.track === "CAREER" ? "Build a Career" : "Sell Into Firms" },
              {
                icon: Sparkles,
                label: "Persona",
                value:
                  personaLabel ??
                  (user.track === "SALES" ? "Vendor / Supplier" : "Not set — take resume quiz"),
              },
              {
                icon: CreditCard,
                label: "Mentor credits",
                value: mentorCreditUsage
                  ? `${formatMentorCreditsUsedLabel(mentorCreditUsage)} · ${mentorCreditUsage.monthLabel}`
                  : "Elite only",
              },
              { icon: Mail, label: "Member since", value: formatDate(user.createdAt) },
            ]).map((row) => (
              <div key={row.label} className="flex items-center gap-3 px-6 py-4">
                <row.icon className="w-4 h-4 text-muted-fg" />
                <span className="text-sm text-muted-fg flex-1">{row.label}</span>
                <span className="text-xs font-medium text-gray-700">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {isMentorUser ? (
          <MentorAccountSettings
            initialEmail={user.email}
            initialCompany={user.company}
            initialProfession={user.profession}
          />
        ) : (
          <MemberAccountSettings
            initialEmail={user.email}
            initialCompany={user.company}
            initialProfession={user.profession}
          />
        )}

        {!isMentorUser && (
          <AccountBillingSection
            tier={user.tier}
            track={user.track}
            stripeStatus={user.stripeStatus}
            stripeCurrentPeriodEnd={user.stripeCurrentPeriodEnd}
            hasStripeCustomer={Boolean(user.stripeCustomerId)}
            paymentsEnabled={isCheckoutConfigured()}
          />
        )}

        {!isMentorUser && !personaLabel && user.track === "CAREER" && (
          <div className="text-center mt-4">
            <Link href="/resume-templates#quiz" className="text-sm text-primary-400 hover:underline">
              Take the resume persona quiz →
            </Link>
          </div>
        )}
      </Reveal>
    </div>
  );
}
