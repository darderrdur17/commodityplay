"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UPGRADE_TO_ACCESS, tierAccessLabel } from "@/data/pricing-shared";
import { CAREER_PLAN_HREF } from "@/lib/pricing-routes";

const TIER_UPGRADE = {
  STARTER: {
    href: CAREER_PLAN_HREF("pro"),
    color: "#3280ff",
  },
  PRO: {
    href: CAREER_PLAN_HREF("elite"),
    color: "#B45309",
  },
};

interface TierGateProps {
  requiredTier: "PRO" | "ELITE";
  /**
   * Effective tier resolved on the server (see `getEntitlements`). Presentational
   * only — the server must already have withheld any gated payload.
   */
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

  const accessLabel = tierAccessLabel(requiredTier);
  const upgrade = requiredTier === "PRO" ? TIER_UPGRADE.STARTER : TIER_UPGRADE.PRO;

  if (compact) {
    /**
     * SECURITY: gated children must NEVER be rendered here. A `blur-sm` wrapper still
     * puts the paid content in the DOM (and in the RSC payload), so anyone can read it
     * from view-source. Gated content is filtered on the server instead; the teaser
     * below is a neutral placeholder that carries no paid bytes.
     */
    return (
      <div className={cn("relative rounded-xl overflow-hidden", className)}>
        <div className="h-32 rounded-xl bg-gradient-to-b from-gray-100 to-white" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl">
          <Lock className="w-5 h-5 text-muted-fg mb-2" />
          <p className="text-xs font-semibold text-gray-600 mb-2">{accessLabel}</p>
          <Link href={upgrade.href}>
            <Button size="sm" variant="default">{UPGRADE_TO_ACCESS}</Button>
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
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
        style={{ background: `${upgrade.color}12`, color: upgrade.color }}
      >
        <Sparkles className="w-3 h-3" />
        {accessLabel}
      </div>
      <Link href={upgrade.href}>
        <Button className="group" style={{ background: upgrade.color }}>
          {UPGRADE_TO_ACCESS}
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
