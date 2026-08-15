import { z } from "zod";
import {
  DEFAULT_MEMBER_DASHBOARD_CONTENT,
  type MemberDashboardContent,
} from "@/data/member-dashboard";

const promoBoxSchema = z.object({
  badge: z.string().min(1).max(80),
  headline: z.string().min(1).max(300),
  description: z.string().min(1).max(500),
  cta: z.string().min(1).max(80),
  footerNote: z.string().max(300).optional(),
});

export const memberDashboardSchema = z.object({
  starterPack: promoBoxSchema,
  upgradeToPro: promoBoxSchema,
  upgradeToElite: promoBoxSchema,
});

export function parseMemberDashboardPayload(payload: unknown) {
  return memberDashboardSchema.safeParse(payload);
}

export function formatMemberDashboardValidationErrors(
  result: ReturnType<typeof parseMemberDashboardPayload>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

export function normalizeMemberDashboardPayload(payload: unknown): MemberDashboardContent {
  const parsed = parseMemberDashboardPayload(payload);
  if (parsed.success) return parsed.data;
  return DEFAULT_MEMBER_DASHBOARD_CONTENT;
}
