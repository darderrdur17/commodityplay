import { z } from "zod";
import {
  DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT,
  type AccountIntelligenceContent,
} from "@/data/account-intelligence-content";

export const accountIntelligenceSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(600),
  myAccountsHeading: z.string().min(1).max(80),
  emptyStateMessage: z.string().min(1).max(300),
  continueSection: z.object({
    heading: z.string().min(1).max(120),
    prepLibraryButton: z.string().min(1).max(120),
    marketNudgesButton: z.string().min(1).max(120),
  }),
});

export function parseAccountIntelligencePayload(payload: unknown) {
  return accountIntelligenceSchema.safeParse(payload);
}

export function formatAccountIntelligenceValidationErrors(
  result: ReturnType<typeof parseAccountIntelligencePayload>
) {
  if (result.success) return null;
  return result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

export function normalizeAccountIntelligencePayload(payload: unknown): AccountIntelligenceContent {
  const parsed = parseAccountIntelligencePayload(payload);
  if (parsed.success) {
    return {
      eyebrow: parsed.data.eyebrow.trim(),
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      myAccountsHeading: parsed.data.myAccountsHeading.trim(),
      emptyStateMessage: parsed.data.emptyStateMessage.trim(),
      continueSection: {
        heading: parsed.data.continueSection.heading.trim(),
        prepLibraryButton: parsed.data.continueSection.prepLibraryButton.trim(),
        marketNudgesButton: parsed.data.continueSection.marketNudgesButton.trim(),
      },
    };
  }

  const partial = (payload ?? {}) as Partial<AccountIntelligenceContent>;
  return {
    eyebrow: partial.eyebrow?.trim() || DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.eyebrow,
    title: partial.title?.trim() || DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.title,
    description: partial.description?.trim() || DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.description,
    myAccountsHeading:
      partial.myAccountsHeading?.trim() || DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.myAccountsHeading,
    emptyStateMessage:
      partial.emptyStateMessage?.trim() || DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.emptyStateMessage,
    continueSection: {
      heading:
        partial.continueSection?.heading?.trim() ||
        DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.continueSection.heading,
      prepLibraryButton:
        partial.continueSection?.prepLibraryButton?.trim() ||
        DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.continueSection.prepLibraryButton,
      marketNudgesButton:
        partial.continueSection?.marketNudgesButton?.trim() ||
        DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT.continueSection.marketNudgesButton,
    },
  };
}
