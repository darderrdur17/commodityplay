const LEVELS: Record<string, number> = { STARTER: 0, PRO: 1, ELITE: 2 };

export const FOR_PRO_ACCESS = "For Pro access";
export const FOR_ELITE_ACCESS = "For Elite access";

export function tierAccessLabel(requiredTier: string): string {
  return requiredTier === "PRO" ? FOR_PRO_ACCESS : FOR_ELITE_ACCESS;
}

export function hasTierAccess(userTier: string, required: string): boolean {
  const userLevel = LEVELS[userTier] ?? 0;
  const requiredLevel = LEVELS[required] ?? 0;
  return userLevel >= requiredLevel;
}
