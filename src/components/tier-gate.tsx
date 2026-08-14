"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";

const TIER_UPGRADE = {
  STARTER: {
    label: "Pro",
    price: "SGD 59/mo",
    href: CAREER_PLAN_HREF("pro"),
    color: "#3280ff",
    description: "Unlock the full playbook, resume templates, career roadmap, and more.",
  },
  PRO: {
    label: "Elite",
    price: "SGD 99/mo",
    href: CAREER_PLAN_HREF("elite"),
    color: "#B45309",
    description: "Unlock case studies, the Desk Channel, Mentor Connect, and job openings.",
  },
};

interface TierGateProps {
  requiredTier: "PRO" | "ELITE";
  userTier?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function TierGate({
  requiredTier,
  userTier = "STARTER",
  children,
  className,
  compact = false,
}: TierGateProps) {
  const tierLevel = { STARTER: 0, PRO: 1, ELITE: 2 };
  const userLevel = tierLevel[userTier as keyof typeof tierLevel] ?? 0;
  const requiredLevel = tierLevel[requiredTier];

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  const upgrade = requiredTier === "PRO" ? TIER_UPGRADE.STARTER : TIER_UPGRADE.PRO;

  if (compact) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden", className)}>
        <div className="blur-sm pointer-events-none select-none" aria-hidden>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl">
          <Lock className="w-5 h-5 text-muted-fg mb-2" />
          <p className="text-xs font-semibold text-gray-600 mb-2">{upgrade.label} required</p>
          <Link href={upgrade.href}>
            <Button size="sm" variant="default">Upgrade</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-border bg-gradient-to-br from-gray-50 to-white p-8 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: `${upgrade.color}15` }}
        >
          <Lock className="w-6 h-6" style={{ color: upgrade.color }} />
        </div>
      </div>
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        style={{ background: `${upgrade.color}12`, color: upgrade.color }}
      >
        <Sparkles className="w-3 h-3" />
        {upgrade.label} Members Only
      </div>
      <p className="text-muted-fg text-sm mb-6 max-w-xs mx-auto">{upgrade.description}</p>
      <Link href={upgrade.href}>
        <Button
          className="group"
          style={{ background: upgrade.color }}
        >
          Unlock {upgrade.label} — {upgrade.price}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </motion.div>
  );
}

// Inline lock icon for content previews
export function ContentLock({ tier }: { tier: "PRO" | "ELITE" }) {
  const color = tier === "ELITE" ? "#B45309" : "#3280ff";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ml-2"
      style={{ background: `${color}12`, color }}
    >
      <Lock className="w-2.5 h-2.5" /> {tier}
    </span>
  );
}
