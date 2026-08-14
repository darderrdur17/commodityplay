import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations";
import { TIER_LABELS, PERSONA_LABELS, formatDate } from "@/lib/utils";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";
import { User, Mail, CreditCard, Sparkles, ArrowRight } from "lucide-react";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      tier: true,
      track: true,
      persona: true,
      mentorCredits: true,
      resumeCredits: true,
      stripeCurrentPeriodEnd: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const tierInfo = TIER_LABELS[user.tier] || TIER_LABELS.STARTER;
  const personaInfo = user.persona ? PERSONA_LABELS[user.persona] : null;

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
            <Badge variant={user.tier === "ELITE" ? "elite" : user.tier === "PRO" ? "pro" : "starter"} className="ml-auto">
              {tierInfo.label}
            </Badge>
          </div>

          <div className="divide-y divide-border">
            {[
              { icon: User, label: "Track", value: user.track === "CAREER" ? "Build a Career" : "Sell Into Firms" },
              { icon: Sparkles, label: "Persona", value: personaInfo?.label || "Not set — complete onboarding" },
              { icon: CreditCard, label: "Mentor credits", value: String(user.mentorCredits) },
              { icon: Mail, label: "Member since", value: formatDate(user.createdAt) },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 px-6 py-4">
                <row.icon className="w-4 h-4 text-muted-fg" />
                <span className="text-sm text-muted-fg flex-1">{row.label}</span>
                <span className="text-sm font-medium text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {user.tier !== "ELITE" && (
          <div className="bg-primary-800 rounded-2xl p-6 text-white mb-6">
            <p className="font-serif font-bold text-lg mb-2">
              {user.tier === "STARTER" ? "Upgrade to Pro" : "Upgrade to Elite"}
            </p>
            <p className="text-white/65 text-sm mb-4">
              {user.tier === "STARTER"
                ? "Unlock the full playbook, resume templates, and career roadmap."
                : "Get Desk Channel, Mentor Connect, and job openings."}
            </p>
            <Link href={user.tier === "STARTER" ? CAREER_PLAN_HREF("pro") : CAREER_PLAN_HREF("elite")}>
              <Button variant="primary-dark" size="sm">
                View Plans <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {user.tier === "ELITE" && user.stripeCurrentPeriodEnd && (
          <p className="text-xs text-muted-fg text-center">
            Elite subscription renews {formatDate(user.stripeCurrentPeriodEnd)}
          </p>
        )}

        {!user.persona && (
          <div className="text-center mt-4">
            <Link href="/onboarding" className="text-sm text-primary-400 hover:underline">
              Complete persona quiz →
            </Link>
          </div>
        )}
      </Reveal>
    </div>
  );
}
