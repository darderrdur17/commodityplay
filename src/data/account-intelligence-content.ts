export interface AccountIntelligenceContent {
  eyebrow: string;
  title: string;
  description: string;
  myAccountsHeading: string;
  emptyStateMessage: string;
  continueSection: {
    heading: string;
    prepLibraryButton: string;
    marketNudgesButton: string;
  };
}

export const DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT: AccountIntelligenceContent = {
  eyebrow: "Account Intelligence",
  title: "Your Desks. Your Edge.",
  description:
    "Track the desks you're engaging, and see the Prep Library topics and Market Nudges you've bookmarked to each one — all in one place.",
  myAccountsHeading: "My Accounts",
  emptyStateMessage:
    "No accounts yet. Add your first desk to start bookmarking prep topics and market nudges.",
  continueSection: {
    heading: "Continue where you left off",
    prepLibraryButton: "← Back to Sales Prep Library",
    marketNudgesButton: "← Back to Sales Market Nudges",
  },
};
