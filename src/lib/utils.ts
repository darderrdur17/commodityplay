import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ELITE_SUBSCRIPTION, PRO_SUBSCRIPTION } from "@/data/pricing-shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "SGD") {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export const TIER_HIERARCHY = {
  STARTER: 0,
  PRO: 1,
  ELITE: 2,
} as const;

export function hasAccess(userTier: string, requiredTier: string): boolean {
  const userLevel = TIER_HIERARCHY[userTier as keyof typeof TIER_HIERARCHY] ?? -1;
  const requiredLevel = TIER_HIERARCHY[requiredTier as keyof typeof TIER_HIERARCHY] ?? 0;
  return userLevel >= requiredLevel;
}

export const PERSONA_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  FRESH_GRAD: { label: "Fresh Graduate", color: "#0F766E", bg: "#CCFBF1" },
  CAREER_SWITCHER: { label: "Career Switcher", color: "#B45309", bg: "#FEF3C7" },
  INSIDER: { label: "Industry Insider", color: "#5B21B6", bg: "#EDE9FE" },
  ANALYST_TRADER: { label: "Analyst / Trader", color: "#1E3A5F", bg: "#DBEAFE" },
  VENDOR: { label: "Vendor / Supplier", color: "#9A3412", bg: "#FEF0E7" },
};

/**
 * Tier badge copy. The `price` strings are DERIVED from `pricing-shared.ts` —
 * they previously hardcoded "SGD 59/mo" / "SGD 99/mo", which is why /account and
 * /dashboard kept advertising SGD prices after the landing pages moved to USD.
 */
export const TIER_LABELS: Record<string, { label: string; price: string; color: string }> = {
  STARTER: { label: "Starter", price: "Free", color: "#16a34a" },
  PRO: { label: "Pro", price: `${PRO_SUBSCRIPTION.label}`, color: "#3280ff" },
  ELITE: { label: "Elite", price: `${ELITE_SUBSCRIPTION.label}`, color: "#B45309" },
};

export function isAdmin(role?: string | null): boolean {
  return role === "ADMIN";
}
