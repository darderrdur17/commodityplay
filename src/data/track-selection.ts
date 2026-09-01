/** Track picker copy — signup, onboarding, waitlist, starter-pack modal, landing CMS defaults. */
export const TRACK_SELECTION = {
  career: {
    title: "Build a Career",
    caption: "Break in or moving up and within industry",
  },
  sales: {
    title: "Sell into Firms",
    caption: "Selling products and services into trading firms",
  },
} as const;

export type TrackSelectionCopy = typeof TRACK_SELECTION;
